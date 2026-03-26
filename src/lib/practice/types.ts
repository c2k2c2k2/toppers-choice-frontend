import type {
  AssessmentAnswerDraft,
  AssessmentDifficulty,
  AssessmentDocument,
  AssessmentQuestion,
  AssessmentTaxonomySummary,
} from "@/lib/assessment";

export type PracticeMode = "TOPIC_WISE" | "MIXED";
export type PracticeSessionStatus = "ACTIVE" | "COMPLETED" | "ABANDONED";

export interface PracticeSessionSummary {
  accuracyPercent: number;
  answeredCount: number;
  configJson: Record<string, unknown> | null;
  correctCount: number;
  createdAt: string;
  difficulty: AssessmentDifficulty | null;
  endedAt: string | null;
  examTrack: AssessmentTaxonomySummary | null;
  examTrackId: string | null;
  id: string;
  lastActivityAt: string | null;
  medium: AssessmentTaxonomySummary | null;
  mediumId: string | null;
  mode: PracticeMode;
  questionCountTarget: number;
  revealedCount: number;
  servedCount: number;
  startedAt: string;
  status: PracticeSessionStatus;
  subject: AssessmentTaxonomySummary | null;
  subjectId: string | null;
  topic: AssessmentTaxonomySummary | null;
  topicId: string | null;
  updatedAt: string;
  wrongCount: number;
}

export interface PracticeSessionQuestion {
  answerJson: AssessmentAnswerDraft | null;
  answeredAt: string | null;
  id: string;
  isCorrect: boolean | null;
  lastSavedAt: string | null;
  latestSavedAnswerJson: AssessmentAnswerDraft | null;
  orderIndex: number;
  question: AssessmentQuestion;
  questionId: string;
  revealedAt: string | null;
  servedAt: string;
}

export interface PracticeSessionDetail extends PracticeSessionSummary {
  questions: PracticeSessionQuestion[];
}

export interface PracticeSessionsListResponse {
  items: PracticeSessionSummary[];
  total: number;
}

export interface PracticeQuestionBatchResponse {
  hasMore: boolean;
  items: PracticeSessionQuestion[];
  session: PracticeSessionSummary;
}

export interface PracticeSaveResultResponse {
  answerJson: AssessmentAnswerDraft;
  lastSavedAt: string;
  questionId: string;
  session: PracticeSessionSummary;
}

export interface PracticeAnswerResultResponse {
  answerJson: AssessmentAnswerDraft;
  answeredAt: string;
  isCorrect: boolean;
  questionId: string;
  session: PracticeSessionSummary;
}

export interface PracticeRevealResultResponse {
  correctAnswerJson: Record<string, unknown>;
  explanationJson: AssessmentDocument | null;
  questionId: string;
  revealedAt: string;
  session: PracticeSessionSummary;
}

export interface PracticeSubjectProgressItem {
  accuracyPercent: number;
  answerCount?: number;
  answeredCount: number;
  correctCount: number;
  examTrack: AssessmentTaxonomySummary;
  lastPracticedAt: string | null;
  revealCount: number;
  servedCount: number;
  subject: AssessmentTaxonomySummary;
  wrongCount: number;
}

export interface PracticeSubjectProgressResponse {
  items: PracticeSubjectProgressItem[];
}

export interface PracticeTopicProgressItem {
  accuracyPercent: number;
  answeredCount: number;
  correctCount: number;
  examTrack: AssessmentTaxonomySummary;
  lastPracticedAt: string | null;
  revealCount: number;
  servedCount: number;
  subject: AssessmentTaxonomySummary;
  topic: AssessmentTaxonomySummary;
  wrongCount: number;
}

export interface PracticeTopicProgressResponse {
  items: PracticeTopicProgressItem[];
}

export interface PracticeWeakQuestion {
  accuracyPercent: number;
  answerCount: number;
  code: string | null;
  correctCount: number;
  difficulty: AssessmentDifficulty;
  examTrack: AssessmentTaxonomySummary;
  lastAnsweredAt: string | null;
  questionId: string;
  revealCount: number;
  statementJson: AssessmentDocument;
  subject: AssessmentTaxonomySummary;
  topic: AssessmentTaxonomySummary | null;
  wrongCount: number;
}

export interface PracticeWeakQuestionsResponse {
  items: PracticeWeakQuestion[];
  total: number;
}

export interface PracticeTrendPoint {
  answeredCount: number;
  correctCount: number;
  date: string;
  revealedCount: number;
  savedCount: number;
  servedCount: number;
  wrongCount: number;
}

export interface PracticeTrendsResponse {
  days: number;
  items: PracticeTrendPoint[];
}

export interface PracticeSessionsFilter {
  limit?: number | null;
  status?: PracticeSessionStatus | null;
}

export interface StartPracticeSessionInput {
  difficulty?: AssessmentDifficulty | null;
  examTrackId?: string | null;
  mediumId?: string | null;
  mode: PracticeMode;
  questionCount?: number | null;
  subjectId?: string | null;
  topicId?: string | null;
}

export interface PracticeQuestionBatchFilter {
  batchSize?: number | null;
}

export interface PracticeAnswerMutationInput {
  answerJson: AssessmentAnswerDraft;
  questionId: string;
}

export interface SubmitPracticeAnswerInput extends PracticeAnswerMutationInput {
  responseTimeMs?: number | null;
}

export interface RevealPracticeQuestionInput {
  questionId: string;
}

export interface EndPracticeSessionInput {
  abandon?: boolean;
}

export interface PracticeSubjectProgressFilter {
  examTrackId?: string | null;
}

export interface PracticeTopicProgressFilter {
  examTrackId?: string | null;
  subjectId?: string | null;
}

export interface PracticeWeakQuestionsFilter {
  limit?: number | null;
  subjectId?: string | null;
  topicId?: string | null;
}

export interface PracticeTrendsFilter {
  days?: number | null;
}
