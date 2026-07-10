import type {
  RelevantExperienceMemory,
  ResumeMemoryContext,
  TargetTemplate,
  Tone,
  UserPreferenceMemory,
  UserProfileMemory,
} from "@/lib/ai/types";

export type {
  RelevantExperienceMemory,
  ResumeMemoryContext,
  UserPreferenceMemory,
  UserProfileMemory,
};

export type MemoryRetrievalInput = {
  userId: string;
  resumeText: string;
  targetTemplate: TargetTemplate;
  tone: Tone;
};
