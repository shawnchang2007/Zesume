"use client";

import { useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import type { BasicProfileInput } from "@/lib/profile/basic-profile";

type BasicProfileFormProps = {
  initialProfile: BasicProfileInput | null;
  enabled: boolean;
};

type FieldName = Exclude<
  keyof BasicProfileInput,
  "targetRoles" | "targetLocations"
>;

const fields: Array<{
  name: FieldName;
  label: string;
  type?: string;
  placeholder?: string;
}> = [
  { name: "fullName", label: "Full name" },
  { name: "contactEmail", label: "Contact email", type: "email" },
  { name: "phone", label: "Phone" },
  { name: "location", label: "Location" },
  { name: "school", label: "School" },
  { name: "degree", label: "Degree" },
  { name: "major", label: "Major" },
  { name: "graduationYear", label: "Graduation year", type: "number" },
  { name: "linkedinUrl", label: "LinkedIn URL", type: "url" },
  { name: "githubUrl", label: "GitHub URL", type: "url" },
  { name: "portfolioUrl", label: "Portfolio URL", type: "url" },
];

function commaList(value?: string[]) {
  return value?.join(", ") ?? "";
}

export function BasicProfileForm({
  initialProfile,
  enabled,
}: BasicProfileFormProps) {
  const [profile, setProfile] = useState<BasicProfileInput>(initialProfile ?? {});
  const [targetRoles, setTargetRoles] = useState(
    commaList(initialProfile?.targetRoles),
  );
  const [targetLocations, setTargetLocations] = useState(
    commaList(initialProfile?.targetLocations),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function saveProfile() {
    if (!enabled || isSaving) return;
    setIsSaving(true);
    setStatus(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          graduationYear: profile.graduationYear
            ? Number(profile.graduationYear)
            : null,
          targetRoles: targetRoles.split(",").map((item) => item.trim()).filter(Boolean),
          targetLocations: targetLocations
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      setStatus(result.success ? "Profile saved" : result.error?.message ?? "Save failed");
    } catch {
      setStatus("Could not save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="profile-form-grid">
        {fields.map((field) => (
          <label className="dashboard-field" key={field.name}>
            <span>{field.label}</span>
            <input
              disabled={!enabled}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  [field.name]: event.target.value,
                }))
              }
              placeholder={field.placeholder}
              type={field.type ?? "text"}
              value={String(profile[field.name] ?? "")}
            />
          </label>
        ))}
        <label className="dashboard-field dashboard-field-wide">
          <span>Target roles</span>
          <input
            disabled={!enabled}
            onChange={(event) => setTargetRoles(event.target.value)}
            placeholder="Software Engineer, Backend Intern"
            value={targetRoles}
          />
        </label>
        <label className="dashboard-field dashboard-field-wide">
          <span>Target locations</span>
          <input
            disabled={!enabled}
            onChange={(event) => setTargetLocations(event.target.value)}
            placeholder="London, Remote"
            value={targetLocations}
          />
        </label>
      </div>
      <div className="dashboard-form-actions">
        <button
          className="button button-primary"
          disabled={!enabled || isSaving}
          onClick={() => void saveProfile()}
          type="button"
        >
          {isSaving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
          {isSaving ? "Saving" : "Save profile"}
        </button>
        {status ? (
          <span className="dashboard-save-status">
            {status === "Profile saved" ? <Check size={14} /> : null}
            {status}
          </span>
        ) : null}
      </div>
    </div>
  );
}
