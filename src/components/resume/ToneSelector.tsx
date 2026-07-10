"use client";

import type { Tone } from "@/lib/ai/types";

const tones: Array<{
  value: Tone;
  label: string;
  hint: string;
}> = [
  {
    value: "professional",
    label: "Professional",
    hint: "Polished and formal",
  },
  {
    value: "concise",
    label: "Concise",
    hint: "Shorter, tighter bullets",
  },
  {
    value: "technical",
    label: "Technical",
    hint: "Tools and implementation",
  },
];

type ToneSelectorProps = {
  value: Tone;
  onChange: (value: Tone) => void;
};

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <div className="field-group">
      <span className="field-label">Tone</span>
      <div className="segmented" role="radiogroup" aria-label="Tone">
        {tones.map((tone) => (
          <button
            aria-checked={value === tone.value}
            className={`segment ${value === tone.value ? "active" : ""}`}
            key={tone.value}
            onClick={() => onChange(tone.value)}
            role="radio"
            type="button"
          >
            <strong>{tone.label}</strong>
            <span>{tone.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
