"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Database,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  CAREER_ITEM_TYPES,
  type CareerItemInput,
  type ManagedCareerItemType,
} from "@/lib/career-items/types";

type CareerItemView = Omit<CareerItemInput, "type" | "bullets" | "skills"> & {
  id: string;
  type: string;
  updatedAt: string;
  bullets: Array<{ content: string }> | string[];
  skills: Array<{ skill: { name: string } }> | string[];
};

type Draft = { draftId: string; items: CareerItemInput[]; warnings: string[] };

const labels: Record<ManagedCareerItemType, string> = {
  EDUCATION: "Education",
  EMPLOYMENT: "Work Experience",
  PROJECT: "Project",
  AWARD: "Award",
  SKILL: "Skill",
  CERTIFICATION: "Certification",
  VOLUNTEERING: "Volunteering",
};

function managedType(value: string): ManagedCareerItemType {
  if (CAREER_ITEM_TYPES.some((type) => type === value)) {
    return value as ManagedCareerItemType;
  }
  if (value === "INTERNSHIP") return "EMPLOYMENT";
  if (value === "ACTIVITY") return "VOLUNTEERING";
  return "PROJECT";
}

function typeLabel(value: string) {
  return labels[managedType(value)];
}

const emptyItem: CareerItemInput = {
  type: "PROJECT",
  title: "",
  organization: null,
  location: null,
  startDate: null,
  endDate: null,
  isCurrent: false,
  summary: null,
  rawContent: null,
  optimizedDescription: null,
  memoryEnabled: true,
  bullets: [],
  skills: [],
};

function dateValue(value: unknown) {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function editable(item: CareerItemView): CareerItemInput {
  return {
    ...item,
    type: managedType(item.type),
    startDate: dateValue(item.startDate) || null,
    endDate: dateValue(item.endDate) || null,
    bullets: item.bullets.map((bullet) =>
      typeof bullet === "string" ? bullet : bullet.content,
    ),
    skills: item.skills.map((skill) =>
      typeof skill === "string" ? skill : skill.skill.name,
    ),
  };
}

export function CareerMemoryManager({ initialItems }: { initialItems: CareerItemView[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<ManagedCareerItemType | "ALL">("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CareerItemInput>(emptyItem);
  const [bulletsText, setBulletsText] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedDraftItems, setSelectedDraftItems] = useState<number[]>([]);

  const filtered = useMemo(
    () => items.filter((item) => filter === "ALL" || managedType(item.type) === filter),
    [filter, items],
  );

  function startNew(type: ManagedCareerItemType = "PROJECT") {
    setEditingId(null);
    setForm({ ...emptyItem, type });
    setBulletsText("");
    setSkillsText("");
    setStatus(null);
  }

  function startEdit(item: CareerItemView) {
    const next = editable(item);
    setEditingId(item.id);
    setForm(next);
    setBulletsText(next.bullets.join("\n"));
    setSkillsText(next.skills.join(", "));
    setStatus(null);
  }

  async function refreshItems() {
    const response = await fetch("/api/career-items");
    const result = (await response.json()) as { success: boolean; data?: CareerItemView[] };
    if (result.success && result.data) setItems(result.data);
  }

  async function saveItem() {
    if (!form.title.trim() || isSaving) {
      setStatus("Add a title before saving.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      const body = {
        ...form,
        bullets: bulletsText.split("\n").map((item) => item.trim()).filter(Boolean),
        skills: skillsText.split(",").map((item) => item.trim()).filter(Boolean),
      };
      const response = await fetch(
        editingId ? `/api/career-items/${editingId}` : "/api/career-items",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as { success: boolean; error?: { message?: string } };
      if (!result.success) {
        setStatus(result.error?.message ?? "Could not save this Career Item.");
        return;
      }
      await refreshItems();
      startNew(form.type);
      setStatus("Career Item saved.");
    } catch {
      setStatus("Could not save this Career Item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeItem(id: string) {
    if (!window.confirm("Delete this Career Item from your account?")) return;
    const response = await fetch(`/api/career-items/${id}`, { method: "DELETE" });
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) startNew();
    } else {
      setStatus("Could not delete this Career Item.");
    }
  }

  async function importResume(file: File) {
    setIsImporting(true);
    setStatus(null);
    setDraft(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/career-items/import", { method: "POST", body: formData });
      const result = (await response.json()) as {
        success: boolean;
        data?: Draft;
        error?: { message?: string };
      };
      if (!result.success || !result.data) {
        setStatus(result.error?.message ?? "Could not analyze this resume.");
        return;
      }
      setDraft(result.data);
      setSelectedDraftItems(result.data.items.map((_, index) => index));
    } catch {
      setStatus("Could not analyze this resume.");
    } finally {
      setIsImporting(false);
    }
  }

  async function commitDraft() {
    if (!draft || !selectedDraftItems.length || isSaving) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/career-items/import/${draft.draftId}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIndexes: selectedDraftItems }),
      });
      const result = (await response.json()) as { success: boolean; data?: { createdCount: number }; error?: { message?: string } };
      if (!result.success) {
        setStatus(result.error?.message ?? "Could not save the import.");
        return;
      }
      await refreshItems();
      setDraft(null);
      setSelectedDraftItems([]);
      setStatus(`${result.data?.createdCount ?? 0} Career Items imported.`);
    } catch {
      setStatus("Could not save the import.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="career-memory-workspace">
      <section className="memory-import-band" id="import-memory">
        <div>
          <span className="dashboard-kicker">Resume import</span>
          <h2>Turn an existing resume into reviewable Career Items</h2>
          <p>DeepSeek prepares a draft. Nothing enters Memory until you confirm it.</p>
        </div>
        <label className="button button-secondary memory-import-button">
          {isImporting ? <Loader2 className="spin" size={16} /> : <FileUp size={16} />}
          {isImporting ? "Analyzing" : "Upload resume"}
          <input
            accept=".txt,.docx"
            disabled={isImporting}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void importResume(file);
            }}
            type="file"
          />
        </label>
      </section>

      {draft ? (
        <section className="memory-draft-band">
          <div className="memory-section-heading">
            <div><span className="dashboard-kicker">Import draft</span><h2>Review before saving</h2></div>
            <button className="button button-primary" disabled={!selectedDraftItems.length || isSaving} onClick={() => void commitDraft()} type="button">
              {isSaving ? <Loader2 className="spin" size={16} /> : <Check size={16} />}
              Save selected
            </button>
          </div>
          {draft.warnings.length ? <p className="memory-warning">{draft.warnings.join(" ")}</p> : null}
          <div className="memory-draft-list">
            {draft.items.map((item, index) => (
              <label className="memory-draft-item" key={`${item.type}-${item.title}-${index}`}>
                <input
                  checked={selectedDraftItems.includes(index)}
                  onChange={(event) => setSelectedDraftItems((current) => event.target.checked ? [...current, index] : current.filter((value) => value !== index))}
                  type="checkbox"
                />
                <span><strong>{item.title}</strong><small>{labels[item.type]}{item.organization ? ` · ${item.organization}` : ""}</small></span>
              </label>
            ))}
          </div>
        </section>
      ) : null}

      <div className="memory-toolbar">
        <div className="memory-filter" role="tablist" aria-label="Career Item type">
          <button className={filter === "ALL" ? "active" : ""} onClick={() => setFilter("ALL")} type="button">All</button>
          {CAREER_ITEM_TYPES.map((type) => <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)} type="button">{labels[type]}</button>)}
        </div>
        <button className="button button-primary" onClick={() => startNew(filter === "ALL" ? "PROJECT" : filter)} type="button"><Plus size={16} /> New item</button>
      </div>

      <div className="memory-editor-layout">
        <section className="memory-item-list" aria-label="Saved Career Items">
          {filtered.length ? filtered.map((item) => (
            <article className={`memory-item ${item.memoryEnabled ? "" : "memory-off"}`} key={item.id}>
              <div className="memory-item-main">
                <span className="memory-type">{typeLabel(item.type)}</span>
                <h3>{item.title}</h3>
                <p>{item.organization || item.optimizedDescription || item.summary || "No description yet"}</p>
                <small><Database size={12} /> {item.memoryEnabled ? "Available to Memory" : "Excluded from Memory"}</small>
              </div>
              <div className="memory-item-actions">
                <button aria-label={`Edit ${item.title}`} onClick={() => startEdit(item)} title="Edit" type="button"><Pencil size={15} /></button>
                <button aria-label={`Delete ${item.title}`} onClick={() => void removeItem(item.id)} title="Delete" type="button"><Trash2 size={15} /></button>
              </div>
            </article>
          )) : <p className="dashboard-empty">No Career Items in this category yet.</p>}
        </section>

        <section className="memory-editor" aria-label="Career Item editor">
          <div className="memory-section-heading"><div><span className="dashboard-kicker">{editingId ? "Edit item" : "New item"}</span><h2>{editingId ? form.title || "Career Item" : "Add to Career Memory"}</h2></div></div>
          <div className="memory-form-grid">
            <label><span>Type</span><select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ManagedCareerItemType }))}>{CAREER_ITEM_TYPES.map((type) => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
            <label><span>Title</span><input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></label>
            <label><span>Organization</span><input value={form.organization ?? ""} onChange={(event) => setForm((current) => ({ ...current, organization: event.target.value || null }))} /></label>
            <label><span>Location</span><input value={form.location ?? ""} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value || null }))} /></label>
            <label><span>Start date</span><input type="date" value={form.startDate ?? ""} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value || null }))} /></label>
            <label><span>End date</span><input disabled={form.isCurrent} type="date" value={form.endDate ?? ""} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value || null }))} /></label>
          </div>
          <div className="memory-check-row">
            <label><input checked={form.isCurrent} onChange={(event) => setForm((current) => ({ ...current, isCurrent: event.target.checked }))} type="checkbox" /> Current</label>
            <label><input checked={form.memoryEnabled} onChange={(event) => setForm((current) => ({ ...current, memoryEnabled: event.target.checked }))} type="checkbox" /> Allow Memory to use this item</label>
          </div>
          <label className="memory-text-field"><span>Original content</span><textarea rows={4} value={form.rawContent ?? ""} onChange={(event) => setForm((current) => ({ ...current, rawContent: event.target.value || null }))} /></label>
          <label className="memory-text-field"><span>Structured summary</span><textarea rows={3} value={form.summary ?? ""} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value || null }))} /></label>
          <label className="memory-text-field"><span>AI-optimized description</span><textarea rows={4} value={form.optimizedDescription ?? ""} onChange={(event) => setForm((current) => ({ ...current, optimizedDescription: event.target.value || null }))} /></label>
          <label className="memory-text-field"><span>Bullets · one per line</span><textarea rows={4} value={bulletsText} onChange={(event) => setBulletsText(event.target.value)} /></label>
          <label className="memory-text-field"><span>Skills · comma separated</span><input value={skillsText} onChange={(event) => setSkillsText(event.target.value)} /></label>
          <div className="dashboard-form-actions">
            <button className="button button-primary" disabled={isSaving} onClick={() => void saveItem()} type="button">{isSaving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}{isSaving ? "Saving" : "Save item"}</button>
            {editingId ? <button className="button button-secondary" onClick={() => startNew()} type="button">Cancel</button> : null}
            {status ? <span className="dashboard-save-status">{status}</span> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
