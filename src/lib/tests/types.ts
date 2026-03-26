import type {
  AssessmentAnswerDraft,
  AssessmentDocument,
  AssessmentQuestion,
  AssessmentTaxonomySummary,
} from "@/lib/assessment";

export type TestFamily = "SUBJECT_WISE" | "MIXED" | "EXAM_STYLE";
export type TestAccessType = "FREE" | "PREMIUM";
export type TestStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TestAttemptStatus = "ACTIVE" | "SUBMITTED" | "AUTO_SUBMITTED";

export interface TestAccessSummary {
  canAttempt: boolean;
  mode: "FULL" | "LOCKED";
  reason: string | null;
  requiresEntitlement: boolean;
}

export interface TestSummary {
  access: TestAccessSummary;
  accessType: TestAccessType;
  archivedAt: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  code: string | null;
  createdAt: string;
  durationMinutes: number;
  examTrack: AssessmentTaxonomySummary | null;
  examTrackId: string | null;
  family: TestFamily;
  id: string;
  isLive: boolean;
  maxAttempts: number;
  maxScore: number;
  medium: AssessmentTaxonomySummary | null;
  mediumId: string | null;
  publishedAt: string | null;
  questionCount: number;
  randomizeQuestionOrder: boolean;
  shortDescription: string | null;
  slug: string;
  status: TestStatus;
  subject: AssessmentTaxonomySummary | null;
  subjectId: string | null;
  title: string;
  updatedAt: string;
}

export interface StudentTestDetail extends TestSummary {
  instructionsJson: AssessmentDocument | null;
}

export interface TestsListResponse {
  items: TestSummary[];
  total: number;
}

export interface TestAttemptSnapshot {
  code: string | null;
  durationMinutes: number;
  examTrack: AssessmentTaxonomySummary | null;
  family: TestFamily;
  id: string;
  maxScore: number;
  medium: AssessmentTaxonomySummary | null;
  questionCount: number;
  shortDescription: string | null;
  slug: string;
  subject: AssessmentTaxonomySummary | null;
  title: string;
}

export interface TestAttemptQuestion {
  answeredAt: string | null;
  awardedMarks: number | null;
  correctAnswerJson: Record<string, unknown> | null;
  explanationJson: AssessmentDocument | null;
  finalAnswerJson: AssessmentAnswerDraft | null;
  id: string;
  isCorrect: boolean | null;
  lastSavedAt: string | null;
  latestSavedAnswerJson: AssessmentAnswerDraft | null;
  orderIndex: number;
  questionId: string;
  questionSnapshot: AssessmentQuestion | Record<string, unknown>;
}

export interface TestAttemptSummary {
  answeredCount: number;
  attemptNumber: number;
  correctCount: number;
  durationMinutes: number;
  expiresAt: string;
  id: string;
  lastSavedAt: string | null;
  maxScore: number;
  percentage: number;
  questionCount: number;
  score: number;
  skippedCount: number;
  startedAt: string;
  status: TestAttemptStatus;
  submittedAt: string | null;
  testId: string;
  testSnapshot: TestAttemptSnapshot;
  timeTakenSeconds: number | null;
  wrongCount: number;
}

export interface TestAttemptDetail extends TestAttemptSummary {
  questions: TestAttemptQuestion[];
  resultBreakdownJson: Record<string, unknown> | null;
  resultSummaryJson: Record<string, unknown> | null;
}

export interface TestAttemptsListResponse {
  items: TestAttemptSummary[];
  total: number;
}

export interface SaveTestAttemptAnswerInput {
  answerJson: AssessmentAnswerDraft;
  questionId: string;
}

export interface SaveTestAttemptAnswerResponse {
  answerJson: AssessmentAnswerDraft;
  attempt: TestAttemptSummary;
  lastSavedAt: string;
  questionId: string;
}

export interface TestsListFilters {
  accessType?: TestAccessType | null;
  examTrackId?: string | null;
  family?: TestFamily | null;
  mediumId?: string | null;
  subjectId?: string | null;
}

export interface TestAttemptsFilters {
  limit?: number | null;
  status?: TestAttemptStatus | null;
  testId?: string | null;
}
