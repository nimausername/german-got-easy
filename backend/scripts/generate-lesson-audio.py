#!/usr/bin/env python3
"""Pre-generate Edge TTS MP3s for speakable German lesson strings.

Run from repo root or backend/:
  python3 backend/scripts/generate-lesson-audio.py
  pnpm --dir backend audio:generate
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import sys
from pathlib import Path

try:
    import edge_tts
except ImportError:
    print(
        "Missing edge-tts. Install with:\n"
        "  pip install -r backend/scripts/requirements-audio.txt",
        file=sys.stderr,
    )
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
LESSONS_DIR = ROOT / "content" / "lessons"
AUDIO_DIR = ROOT / "content" / "audio"
MANIFEST_PATH = ROOT / "content" / "audio-manifest.json"

VOICE = "de-DE-KatjaNeural"
RATE = "-10%"


def audio_hash(text: str) -> str:
    """Return the content-addressed hash for a German speakable string."""
    payload = f"{VOICE}\n{text}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()[:32]


def add_text(bucket: set[str], value: object) -> None:
    if isinstance(value, str):
        trimmed = value.strip()
        if trimmed:
            bucket.add(trimmed)


def collect_from_teach_block(block: dict, bucket: set[str]) -> None:
    block_type = block.get("type")
    if block_type == "explain":
        for example in block.get("examples") or []:
            if isinstance(example, dict):
                add_text(bucket, example.get("de"))
    elif block_type == "phrases":
        for item in block.get("items") or []:
            if isinstance(item, dict):
                add_text(bucket, item.get("de"))
    elif block_type == "pattern":
        for example in block.get("examples") or []:
            add_text(bucket, example)
    elif block_type == "dialogue":
        for line in block.get("lines") or []:
            if isinstance(line, dict):
                add_text(bucket, line.get("de"))
    elif block_type == "listen_model":
        add_text(bucket, block.get("text"))
    elif block_type == "speak_model":
        add_text(bucket, block.get("modelText"))


def collect_from_exercise(exercise: dict, bucket: set[str]) -> None:
    payload = exercise.get("payload")
    if not isinstance(payload, dict):
        return
    add_text(bucket, payload.get("speakText"))
    add_text(bucket, payload.get("modelText"))


def collect_texts() -> list[str]:
    if not LESSONS_DIR.is_dir():
        raise SystemExit(f"Lessons directory not found: {LESSONS_DIR}")

    bucket: set[str] = set()
    for path in sorted(LESSONS_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            continue
        for unit in data:
            if not isinstance(unit, dict):
                continue
            for lesson in unit.get("lessons") or []:
                if not isinstance(lesson, dict):
                    continue
                for block in lesson.get("teachBlocks") or []:
                    if isinstance(block, dict):
                        collect_from_teach_block(block, bucket)
                for exercise in lesson.get("exercises") or []:
                    if isinstance(exercise, dict):
                        collect_from_exercise(exercise, bucket)

    return sorted(bucket)


async def synthesize(text: str, out_path: Path) -> None:
    communicate = edge_tts.Communicate(text, VOICE, rate=RATE)
    await communicate.save(str(out_path))


def is_usable_audio(path: Path, text: str) -> bool:
    """Reject empty or truncated Edge TTS outputs (often ~2KB / 0.36s stubs)."""
    if not path.is_file():
        return False
    size = path.stat().st_size
    # Healthy KatjaNeural clips are typically well above 4KB even for short words.
    min_bytes = max(4000, min(12_000, 800 + len(text.encode("utf-8")) * 120))
    return size >= min_bytes


async def synthesize_one(
    text: str,
    digest: str,
    semaphore: asyncio.Semaphore,
) -> tuple[str, str]:
    """Returns (status, digest) where status is created|skipped|failed."""
    out_path = AUDIO_DIR / f"{digest}.mp3"
    if is_usable_audio(out_path, text):
        return ("skipped", digest)

    async with semaphore:
        try:
            # Remove stubs so edge-tts always writes a fresh file.
            if out_path.exists():
                out_path.unlink(missing_ok=True)
            await synthesize(text, out_path)
            if not is_usable_audio(out_path, text):
                raise RuntimeError(
                    f"truncated audio ({out_path.stat().st_size if out_path.exists() else 0} bytes)",
                )
            print(f"  + {digest}.mp3  ({text[:48]!r})", flush=True)
            return ("created", digest)
        except Exception as exc:  # noqa: BLE001 — surface and continue batch
            if out_path.exists():
                out_path.unlink(missing_ok=True)
            print(f"  ! failed {text[:48]!r}: {exc}", file=sys.stderr, flush=True)
            return ("failed", digest)


async def main() -> None:
    texts = collect_texts()
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)

    print(
        f"Found {len(texts)} unique speakable strings (voice={VOICE}, rate={RATE})",
        flush=True,
    )

    semaphore = asyncio.Semaphore(6)
    tasks = [
        synthesize_one(text, audio_hash(text), semaphore) for text in texts
    ]
    results = await asyncio.gather(*tasks)

    created = sum(1 for status, _ in results if status == "created")
    skipped = sum(1 for status, _ in results if status == "skipped")
    failed = sum(1 for status, _ in results if status == "failed")

    manifest = {text: audio_hash(text) for text in texts}
    # Only keep entries whose files exist and look complete
    manifest = {
        text: digest
        for text, digest in manifest.items()
        if is_usable_audio(AUDIO_DIR / f"{digest}.mp3", text)
    }

    MANIFEST_PATH.write_text(
        json.dumps(
            {
                "voice": VOICE,
                "rate": RATE,
                "entries": manifest,
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=False,
        )
        + "\n",
        encoding="utf-8",
    )

    print(
        f"Done. created={created} skipped={skipped} failed={failed} "
        f"manifest_entries={len(manifest)} path={MANIFEST_PATH}",
        flush=True,
    )
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
