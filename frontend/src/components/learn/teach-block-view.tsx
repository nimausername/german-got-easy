"use client";

import { Volume2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import type { TeachBlock } from "@/lib/learn";
import { canPlayGerman, canSpeakGerman, playGerman } from "@/lib/tts";

type TeachBlockViewProps = {
  readonly block: TeachBlock;
};

const subscribeNoop = () => () => undefined;

type ListenButtonProps = {
  readonly label: string;
  readonly text: string;
  readonly audioUrl?: string | null;
};

/**
 * Compact listen control that prefers neural audio over browser TTS.
 */
const ListenButton = ({ label, text, audioUrl }: ListenButtonProps) => {
  const browserTts = useSyncExternalStore(subscribeNoop, canSpeakGerman, () => false);
  if (!audioUrl && !browserTts) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-9 shrink-0 touch-manipulation px-2.5 sm:min-h-10 sm:px-3"
      aria-label={label}
      onClick={() => playGerman(text, audioUrl)}
    >
      <Volume2 data-icon="inline-start" />
      <span className="hidden sm:inline">Listen</span>
    </Button>
  );
};

/**
 * Renders one ungraded teach block inside a lesson.
 */
export const TeachBlockView = ({ block }: TeachBlockViewProps) => {
  const [revealed, setRevealed] = useState(false);
  const browserTts = useSyncExternalStore(subscribeNoop, canSpeakGerman, () => false);

  if (block.type === "explain") {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg text-brand-ink sm:text-2xl">{block.title}</h2>
        <p className="text-base leading-relaxed text-foreground/90">{block.body}</p>
        {block.examples?.length ? (
          <ul className="space-y-2 border-l-2 border-primary/30 pl-3 sm:pl-4">
            {block.examples.map((example) => (
              <li
                key={`${example.de}-${example.en}`}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-ink">{example.de}</p>
                  <p className="text-sm text-muted-foreground">{example.en}</p>
                </div>
                <ListenButton
                  label={`Play ${example.de}`}
                  text={example.de}
                  audioUrl={example.audioUrl}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (block.type === "phrases") {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg text-brand-ink sm:text-2xl">{block.title}</h2>
        <ul className="divide-y divide-border/70">
          {block.items.map((item) => (
            <li
              key={`${item.de}-${item.en}`}
              className="flex items-start justify-between gap-3 py-2.5 sm:py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-ink">{item.de}</p>
                <p className="text-sm text-muted-foreground">{item.en}</p>
              </div>
              <ListenButton label={`Play ${item.de}`} text={item.de} audioUrl={item.audioUrl} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === "pattern") {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg text-brand-ink sm:text-2xl">{block.title}</h2>
        <p className="rounded-lg bg-muted/60 px-4 py-3 font-display text-lg text-brand-ink">
          {block.template}
        </p>
        <p className="text-sm text-muted-foreground">{block.meaning}</p>
        {block.examples?.length ? (
          <ul className="space-y-2">
            {block.examples.map((example, index) => (
              <li
                key={example}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="min-w-0">{example}</span>
                <ListenButton
                  label={`Play ${example}`}
                  text={example}
                  audioUrl={block.exampleAudioUrls?.[index]}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  if (block.type === "dialogue") {
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg text-brand-ink sm:text-2xl">{block.title}</h2>
        <div className="space-y-3">
          {block.lines.map((line, index) => (
            <div
              key={`${line.speaker}-${index}`}
              className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 px-3 py-3 sm:px-4"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {line.speaker}
                </p>
                <p className="mt-1 font-medium text-brand-ink">{line.de}</p>
                <p className="text-sm text-muted-foreground">{line.en}</p>
              </div>
              <ListenButton label={`Play ${line.de}`} text={line.de} audioUrl={line.audioUrl} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "listen_model") {
    const canPlay = canPlayGerman(block.audioUrl) || browserTts;
    return (
      <div className="space-y-4">
        <h2 className="font-display text-lg text-brand-ink sm:text-2xl">{block.title}</h2>
        <p className="font-display text-lg text-brand-ink">{block.text}</p>
        {block.hint ? <p className="text-sm text-muted-foreground">{block.hint}</p> : null}
        {canPlay ? (
          <Button
            type="button"
            className="min-h-11 touch-manipulation"
            aria-label="Play listening model"
            onClick={() => playGerman(block.text, block.audioUrl)}
          >
            <Volume2 data-icon="inline-start" />
            Play audio
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Audio is unavailable in this browser. Read the line aloud yourself.
          </p>
        )}
      </div>
    );
  }

  const canPlayModel = canPlayGerman(block.audioUrl) || browserTts;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-brand-ink sm:text-2xl">{block.title}</h2>
      <p className="text-base text-foreground/90">{block.prompt}</p>
      {block.hint ? <p className="text-sm text-muted-foreground">{block.hint}</p> : null}

      <div className="rounded-xl bg-muted/60 px-4 py-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Model line
        </p>
        {revealed ? (
          <p className="mt-2 font-display text-xl leading-snug text-brand-ink sm:text-2xl">
            {block.modelText}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Reveal the model when you want to check yourself.
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 touch-manipulation"
            onClick={() => setRevealed((value) => !value)}
          >
            {revealed ? "Hide model" : "Reveal model"}
          </Button>
          {canPlayModel ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11 touch-manipulation"
              aria-label="Play speaking model"
              onClick={() => playGerman(block.modelText, block.audioUrl)}
            >
              <Volume2 data-icon="inline-start" />
              Hear model
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
