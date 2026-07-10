export type TargetTemplate = "software_engineering" | "quant" | "finance";

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

export type RewriteResumeInput = {
  resumeText: string;
  targetTemplate: TargetTemplate;
  tone: Tone;
  memory?: ResumeMemoryContext;
};

export type RewriteResumeOutput = {
  rewrittenResume: string;
  suggestions: string[];
  qualityWarnings: string[];
  provider: string;
  model: string;
};
