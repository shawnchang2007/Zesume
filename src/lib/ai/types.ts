import type {
  ResumeTemplateId,
  ResumeTemplateSpec,
} from "@/lib/resume/templates";

export type CareerTarget =
  | "software_engineering"
  | "quant"
  | "finance"
  | "general";

// Kept as an alias while existing memory and export code migrates to CareerTarget.
export type TargetTemplate = CareerTarget;

export type Tone = "professional" | "concise" | "technical";

export type UserProfileMemory = {
  fullName?: string | null;
  educationSummary?: string | null;
  careerStage?: string | null;
  targetRoles: string[];
  industries: string[];
  locationPreference?: string | null;
  notes?: string | null;
};

export type UserPreferenceMemory = {
  preferredTone?: string | null;
  preferredBulletStyle?: string | null;
  avoidPhrases: string[];
  defaultTemplate?: string | null;
  defaultUseMemory: boolean;
};

export type RelevantExperienceMemory = {
  id: string;
  title: string;
  organization?: string | null;
  category: string;
  description?: string | null;
  tags: string[];
  bullets: Array<{
    content: string;
    tags: string[];
  }>;
};

export type ResumeMemoryContext = {
  profile?: UserProfileMemory | null;
  preferences?: UserPreferenceMemory | null;
  relevantExperiences?: RelevantExperienceMemory[];
};

export type StructuredResumeHeader = {
  name: string;
  location: string;
  email: string;
  phone: string;
  links: string[];
};

export type StructuredResumeItem = {
  name: string;
  role: string;
  organization: string;
  date: string;
  location: string;
  meta: string;
  details: string[];
  bullets: string[];
};

export type StructuredResumeSection = {
  title: string;
  items: StructuredResumeItem[];
};

export type ResumeQualityNotes = {
  majorChangesMade: string[];
  missingInformation: string[];
  warnings: string[];
};

export type StructuredResume = {
  header: StructuredResumeHeader;
  sections: StructuredResumeSection[];
  qualityNotes: ResumeQualityNotes;
};

export type RewriteResumeInput = {
  resumeText: string;
  targetTrack: CareerTarget;
  templateId: ResumeTemplateId;
  templateSpec: ResumeTemplateSpec;
  tone: Tone;
  memory?: ResumeMemoryContext;
};

export type RewriteResumeOutput = {
  structuredResume: StructuredResume;
  rewrittenResume: string;
  suggestions: string[];
  qualityWarnings: string[];
  provider: string;
  model: string;
};

export type AnalyzeResumeTemplateInput = {
  templateText: string;
  fileName: string;
};

export type AnalyzeResumeTemplateOutput = {
  templateSpec: ResumeTemplateSpec;
  provider: "deepseek";
  model: string;
};

export type AnalyzeCareerImportInput = {
  resumeText: string;
  fileName: string;
};

export type AnalyzeCareerImportOutput = {
  items: import("@/lib/career-items/types").CareerItemInput[];
  warnings: string[];
  provider: string;
  model: string;
};
