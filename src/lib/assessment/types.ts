export type AssessmentDocument =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export type AssessmentQuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TEXT_INPUT";

export type AssessmentDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface AssessmentTaxonomySummary {
  code: string;
  id: string;
  name: string;
  slug: string;
}

export interface AssessmentAssetSummary {
  accessLevel: "PUBLIC" | "AUTHENTICATED" | "PROTECTED" | "ADMIN_ONLY";
  contentType: string;
  id: string;
  originalFileName: string;
  protectedDeliveryPath: string;
  publicDeliveryPath: string;
  purpose:
    | "NOTE_PDF"
    | "CMS_IMAGE"
    | "QUESTION_IMAGE"
    | "PROFILE_IMAGE"
    | "CONTENT_IMAGE"
    | "GENERIC_PDF"
    | "GENERIC_IMAGE";
  sizeBytes: number | null;
  status: "PENDING_UPLOAD" | "READY" | "REVOKED";
}

export interface AssessmentQuestionMediaReference {
  fileAsset: AssessmentAssetSummary;
  fileAssetId: string;
  id: string;
  localeCode: string | null;
  optionKey: string | null;
  orderIndex: number;
  usage: "STATEMENT" | "OPTION" | "EXPLANATION";
}

export interface AssessmentQuestionOption {
  contentJson: AssessmentDocument;
  createdAt: string;
  id: string;
  metaJson: Record<string, unknown> | null;
  optionKey: string;
  orderIndex: number;
  updatedAt: string;
}

export interface AssessmentQuestion {
  code: string | null;
  difficulty: AssessmentDifficulty;
  examTrack: AssessmentTaxonomySummary;
  id: string;
  mediaReferences: AssessmentQuestionMediaReference[];
  medium: AssessmentTaxonomySummary | null;
  metadataJson: Record<string, unknown> | null;
  options: AssessmentQuestionOption[];
  statementJson: AssessmentDocument;
  subject: AssessmentTaxonomySummary;
  topic: AssessmentTaxonomySummary | null;
  type: AssessmentQuestionType;
}

export interface AssessmentAnswerDraft {
  optionKeys?: string[];
  text?: string;
}
