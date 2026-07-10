"use client";

import type { TargetTemplate } from "@/lib/ai/types";

const templates: Array<{
  value: TargetTemplate;
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
    hint: "Leadership, teamwork, impact",
  },
];

type TemplateSelectorProps = {
  value: TargetTemplate;
  onChange: (value: TargetTemplate) => void;
};

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="field-group">
      <span className="field-label">Target template</span>
      <div className="segmented" role="radiogroup" aria-label="Target template">
        {templates.map((template) => (
          <button
            aria-checked={value === template.value}
            className={`segment ${value === template.value ? "active" : ""}`}
            key={template.value}
            onClick={() => onChange(template.value)}
            role="radio"
            type="button"
          >
            <strong>{template.label}</strong>
            <span>{template.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
