export type EnglishSpeakingLanguage = "HINDI" | "MARATHI" | "ENGLISH";
export type EnglishSpeakingTopicAccessType = "FREE" | "PREMIUM";
export type EnglishSpeakingTopicStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EnglishSpeakingTopicVisibility =
  | "PUBLIC"
  | "AUTHENTICATED"
  | "INTERNAL";
export type EnglishSpeakingAudioStatus =
  | "NOT_GENERATED"
  | "PREVIEW_READY"
  | "FINALIZED"
  | "FAILED";
export type StudentEnglishSpeakingAccessMode = "FULL" | "LOCKED";

export interface AdminEnglishSpeakingAudioState {
  finalizedAt: string | null;
  finalizedStreamPath: string | null;
  generatedAt: string | null;
  hasFinalized: boolean;
  hasPreview: boolean;
  isCurrent: boolean;
  language: EnglishSpeakingLanguage;
  lastError: string | null;
  modelId: string | null;
  outputFormat: string | null;
  previewStreamPath: string | null;
  status: EnglishSpeakingAudioStatus;
  voiceId: string | null;
}

export interface AdminEnglishSpeakingSentence {
  audioStates: AdminEnglishSpeakingAudioState[];
  englishText: string;
  hindiText: string;
  id: string;
  marathiText: string;
  orderIndex: number;
}

export interface AdminEnglishSpeakingTopicSummary {
  accessType: EnglishSpeakingTopicAccessType;
  description: string | null;
  id: string;
  isReadyToPublish: boolean;
  orderIndex: number;
  publishedAt: string | null;
  readySentenceCount: number;
  sentenceCount: number;
  slug: string;
  status: EnglishSpeakingTopicStatus;
  title: string;
  updatedAt: string;
  visibility: EnglishSpeakingTopicVisibility;
}

export interface AdminEnglishSpeakingTopicDetail
  extends AdminEnglishSpeakingTopicSummary {
  createdAt: string;
  sentences: AdminEnglishSpeakingSentence[];
}

export interface AdminEnglishSpeakingTopicListResponse {
  items: AdminEnglishSpeakingTopicSummary[];
  total: number;
}

export interface EnglishSpeakingPdfAsset {
  contentType: string;
  id: string;
  originalFileName: string;
  protectedDeliveryPath: string;
  sizeBytes: number | null;
}

export interface AdminEnglishSpeakingMaterial {
  createdAt: string;
  id: string;
  notesFileAssetId: string | null;
  notesPdf: EnglishSpeakingPdfAsset | null;
  updatedAt: string;
}

export interface StudentEnglishSpeakingMaterial {
  notesPdf: EnglishSpeakingPdfAsset | null;
}

export interface UpdateEnglishSpeakingMaterialInput {
  notesFileAssetId?: string | null;
}

export interface UpsertEnglishSpeakingSentenceInput {
  englishText: string;
  hindiText: string;
  id?: string;
  marathiText: string;
  orderIndex?: number;
}

export interface CreateEnglishSpeakingTopicInput {
  accessType?: EnglishSpeakingTopicAccessType;
  description?: string;
  orderIndex?: number;
  sentences?: UpsertEnglishSpeakingSentenceInput[];
  slug?: string;
  title: string;
  visibility?: EnglishSpeakingTopicVisibility;
}

export type UpdateEnglishSpeakingTopicInput =
  Partial<CreateEnglishSpeakingTopicInput>;

export interface GenerateEnglishSpeakingAudioInput {
  languages?: EnglishSpeakingLanguage[];
}

export interface FinalizeEnglishSpeakingAudioInput {
  languages?: EnglishSpeakingLanguage[];
}

export interface StudentEnglishSpeakingAudioTrack {
  language: EnglishSpeakingLanguage;
  streamPath: string;
}

export interface StudentEnglishSpeakingSentence {
  audioTracks: StudentEnglishSpeakingAudioTrack[];
  englishText: string;
  hindiText: string;
  id: string;
  marathiText: string;
  orderIndex: number;
}

export interface StudentEnglishSpeakingTopicSummary {
  accessMode: StudentEnglishSpeakingAccessMode;
  accessType: EnglishSpeakingTopicAccessType;
  description: string | null;
  id: string;
  publishedAt: string | null;
  sentenceCount: number;
  slug: string;
  title: string;
  updatedAt: string;
}

export interface StudentEnglishSpeakingTopicDetail
  extends StudentEnglishSpeakingTopicSummary {
  sentences: StudentEnglishSpeakingSentence[];
}

export interface StudentEnglishSpeakingTopicListResponse {
  items: StudentEnglishSpeakingTopicSummary[];
  material: StudentEnglishSpeakingMaterial;
  total: number;
}

export const ENGLISH_SPEAKING_LANGUAGE_ORDER: EnglishSpeakingLanguage[] = [
  "HINDI",
  "MARATHI",
  "ENGLISH",
];

export function getEnglishSpeakingLanguageLabel(
  language: EnglishSpeakingLanguage,
) {
  switch (language) {
    case "HINDI":
      return "Hindi";
    case "MARATHI":
      return "Marathi";
    case "ENGLISH":
      return "English";
  }
}

export function createEmptyEnglishSpeakingSentence(
  orderIndex: number,
): UpsertEnglishSpeakingSentenceInput {
  return {
    englishText: "",
    hindiText: "",
    marathiText: "",
    orderIndex,
  };
}

export function getAudioStateForLanguage(
  sentence: Pick<AdminEnglishSpeakingSentence, "audioStates">,
  language: EnglishSpeakingLanguage,
) {
  return sentence.audioStates.find((state) => state.language === language) ?? null;
}
