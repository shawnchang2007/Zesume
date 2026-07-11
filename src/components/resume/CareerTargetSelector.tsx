"use client";

import type { CareerTarget } from "@/lib/ai/types";

const careerTargets: Array<{
  value: CareerTarget;
  label: string;
  hint: string;
}> = [
  {
    value: "software_engineering",
    label: "SWE",
    hint: "Projects, stacks, implementation",
  },
  {
    value: "quant",
    label: "Quant",
    hint: "Math, data, models",
  },
  {
    value: "finance",
    label: "Finance",
    hint: "Leadership, analysis, impact",
  },
  {
    value: "general",
    label: "General",
    hint: "Balanced internship applications",
  },
];

type CareerTargetSelectorProps = {
  value: CareerTarget;
  onChange: (value: CareerTarget) => void;
};

export function CareerTargetSelector({
  value,
  onChange,
}: CareerTargetSelectorProps) {
  return (
    <div className="field-group">
      <span className="field-label">Career target</span>
      <div
        className="segmented career-segmented"
        role="radiogroup"
        aria-label="Career target"
      >
        {careerTargets.map((target) => (
          <button
            aria-checked={value === target.value}
            className={`segment ${value === target.value ? "active" : ""}`}
            key={target.value}
            onClick={() => onChange(target.value)}
            role="radio"
            type="button"
          >
            <strong>{target.label}</strong>
            <span>{target.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
