import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  areAssessmentDraftsEqual,
  normalizeAssessmentDraft,
  type AssessmentAnswerDraft,
} from "@/lib/assessment";
import type { TestAttemptQuestion } from "@/lib/tests";
import { buildSessionPersistOptions } from "@/stores/persist-options";

interface PersistedTestAttemptState {
  currentQuestionId: string | null;
  drafts: Record<string, AssessmentAnswerDraft>;
  expiresAt: string | null;
  syncedDrafts: Record<string, AssessmentAnswerDraft>;
}

interface TestAttemptStoreState {
  activeAttemptId: string | null;
  attempts: Record<string, PersistedTestAttemptState>;
}

interface TestAttemptStoreActions {
  clearTestAttempt: (attemptId: string) => void;
  hydrateTestAttempt: (
    attemptId: string,
    expiresAt: string,
    questions: TestAttemptQuestion[],
  ) => void;
  markTestAnswerSynced: (
    attemptId: string,
    questionId: string,
    draft: AssessmentAnswerDraft,
  ) => void;
  setTestAttemptCurrentQuestion: (
    attemptId: string,
    questionId: string | null,
  ) => void;
  setTestAttemptDraft: (
    attemptId: string,
    questionId: string,
    draft: AssessmentAnswerDraft,
  ) => void;
}

export type TestAttemptStore = TestAttemptStoreState & TestAttemptStoreActions;

function buildAttemptEntry(
  existing: PersistedTestAttemptState | undefined,
  expiresAt: string,
  questions: TestAttemptQuestion[],
) {
  const drafts = {
    ...(existing?.drafts ?? {}),
  };
  const syncedDrafts = {
    ...(existing?.syncedDrafts ?? {}),
  };

  for (const question of questions) {
    const serverDraft = normalizeAssessmentDraft(
      question.finalAnswerJson ?? question.latestSavedAnswerJson,
    );

    drafts[question.questionId] ??= serverDraft;
    syncedDrafts[question.questionId] = serverDraft;
  }

  return {
    currentQuestionId:
      existing?.currentQuestionId ?? questions[0]?.questionId ?? null,
    drafts,
    expiresAt,
    syncedDrafts,
  } satisfies PersistedTestAttemptState;
}

export const useTestAttemptStore = create<TestAttemptStore>()(
  persist(
    (set) => ({
      activeAttemptId: null,
      attempts: {},
      clearTestAttempt: (attemptId) =>
        set((state) => {
          const nextAttempts = {
            ...state.attempts,
          };
          delete nextAttempts[attemptId];

          return {
            activeAttemptId:
              state.activeAttemptId === attemptId ? null : state.activeAttemptId,
            attempts: nextAttempts,
          };
        }),
      hydrateTestAttempt: (attemptId, expiresAt, questions) =>
        set((state) => ({
          activeAttemptId: attemptId,
          attempts: {
            ...state.attempts,
            [attemptId]: buildAttemptEntry(
              state.attempts[attemptId],
              expiresAt,
              questions,
            ),
          },
        })),
      markTestAnswerSynced: (attemptId, questionId, draft) =>
        set((state) => {
          const currentAttempt = state.attempts[attemptId];
          if (!currentAttempt) {
            return state;
          }

          const normalizedDraft = normalizeAssessmentDraft(draft);

          return {
            attempts: {
              ...state.attempts,
              [attemptId]: {
                ...currentAttempt,
                drafts: {
                  ...currentAttempt.drafts,
                  [questionId]: normalizedDraft,
                },
                syncedDrafts: {
                  ...currentAttempt.syncedDrafts,
                  [questionId]: normalizedDraft,
                },
              },
            },
          };
        }),
      setTestAttemptCurrentQuestion: (attemptId, questionId) =>
        set((state) => {
          const currentAttempt = state.attempts[attemptId];
          if (!currentAttempt) {
            return state;
          }

          return {
            activeAttemptId: attemptId,
            attempts: {
              ...state.attempts,
              [attemptId]: {
                ...currentAttempt,
                currentQuestionId: questionId,
              },
            },
          };
        }),
      setTestAttemptDraft: (attemptId, questionId, draft) =>
        set((state) => {
          const currentAttempt = state.attempts[attemptId];
          if (!currentAttempt) {
            return state;
          }

          const normalizedDraft = normalizeAssessmentDraft(draft);
          const existingDraft = currentAttempt.drafts[questionId];
          if (areAssessmentDraftsEqual(existingDraft, normalizedDraft)) {
            return state;
          }

          return {
            attempts: {
              ...state.attempts,
              [attemptId]: {
                ...currentAttempt,
                currentQuestionId: questionId,
                drafts: {
                  ...currentAttempt.drafts,
                  [questionId]: normalizedDraft,
                },
              },
            },
          };
        }),
    }),
    buildSessionPersistOptions<TestAttemptStore>("test-attempt", (state) => ({
      activeAttemptId: state.activeAttemptId,
      attempts: state.attempts,
    })),
  ),
);
