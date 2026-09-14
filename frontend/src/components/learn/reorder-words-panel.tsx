"use client";

import { useId, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type ReorderChip = {
  readonly id: string;
  readonly text: string;
};

type ReorderWordsPanelProps = {
  readonly tokens: readonly string[];
  readonly value: unknown;
  readonly onChange: (next: string[]) => void;
};

const toChips = (texts: readonly string[], idPrefix: string): ReorderChip[] =>
  texts.map((text, index) => ({
    id: `${idPrefix}-${index}-${text}`,
    text,
  }));

/**
 * Resolves the visible token order from the saved answer or the shuffled bank.
 */
export const resolveReorderTokens = (
  value: unknown,
  tokens: readonly string[],
): string[] => {
  if (!Array.isArray(value)) return [...tokens];
  const texts = value.filter((item): item is string => typeof item === "string");
  if (texts.length !== tokens.length) return [...tokens];
  return texts;
};

/**
 * Drag-and-drop / tap-to-move word reorder for practice tasks.
 */
export const ReorderWordsPanel = ({
  tokens,
  value,
  onChange,
}: ReorderWordsPanelProps) => {
  const idPrefix = useId();
  const chips = toChips(resolveReorderTokens(value, tokens), idPrefix);
  const suppressClickRef = useRef(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const commit = (next: ReorderChip[]) => {
    onChange(next.map((chip) => chip.text));
  };

  const moveChip = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIndex = chips.findIndex((chip) => chip.id === fromId);
    const toIndex = chips.findIndex((chip) => chip.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...chips];
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    commit(next);
  };

  const handleKeyMove = (chipId: string, direction: -1 | 1) => {
    const index = chips.findIndex((chip) => chip.id === chipId);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= chips.length) return;
    const next = [...chips];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    commit(next);
  };

  const handleChipActivate = (chipId: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (!selectedId) {
      setSelectedId(chipId);
      return;
    }
    if (selectedId === chipId) {
      setSelectedId(null);
      return;
    }
    moveChip(selectedId, chipId);
    setSelectedId(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Drag words into place, or tap one word then tap where it should go.
      </p>
      <ul
        className="flex flex-wrap gap-2 rounded-xl bg-muted/50 p-3"
        aria-label="Reorder words"
        onDragOver={(event) => event.preventDefault()}
      >
        {chips.map((chip) => {
          const isDragging = dragId === chip.id;
          const isOver = overId === chip.id && dragId !== chip.id;
          const isSelected = selectedId === chip.id;
          return (
            <li key={chip.id} className="list-none">
              <button
                type="button"
                draggable
                aria-grabbed={isDragging || isSelected}
                aria-pressed={isSelected}
                aria-label={`${chip.text}. Drag or tap to reorder`}
                className={cn(
                  "inline-flex min-h-11 touch-manipulation items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-base font-medium text-brand-ink shadow-xs transition-colors",
                  "cursor-grab hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                  "active:cursor-grabbing",
                  isDragging && "opacity-50",
                  isOver && "border-primary bg-primary/10",
                  isSelected && "border-primary ring-2 ring-primary/30",
                )}
                onClick={() => handleChipActivate(chip.id)}
                onDragStart={(event) => {
                  setSelectedId(null);
                  setDragId(chip.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", chip.id);
                }}
                onDragEnd={() => {
                  if (dragId) suppressClickRef.current = true;
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverId(chip.id);
                }}
                onDragLeave={() => {
                  setOverId((current) => (current === chip.id ? null : current));
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const fromId = event.dataTransfer.getData("text/plain") || dragId;
                  if (fromId) moveChip(fromId, chip.id);
                  suppressClickRef.current = true;
                  setDragId(null);
                  setOverId(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    handleKeyMove(chip.id, -1);
                  }
                  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                    event.preventDefault();
                    handleKeyMove(chip.id, 1);
                  }
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleChipActivate(chip.id);
                  }
                }}
              >
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {chip.text}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="font-display text-lg text-brand-ink" aria-live="polite">
        {chips.map((chip) => chip.text).join(" ")}
      </p>
    </div>
  );
};
