import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  areAssessmentDraftsEqual,
  normalizeAssessmentDraft,
  type AssessmentAnswerDraft,
} from "@/lib/assessment";
import type {
  PracticeRevealResultResponse,
  PracticeSessionQuestion,
} from "@/lib/practice";
import { buildSessionPersistOptions } from "@/stores/persist-options";

interface PersistedPracticeRevealState {
  correctAnswerJson: Record<string, unknown>;
  explanationJson: Record<string, unknown> | unknown[] | string | number | boolean | null;
  questionId: string;
  revealedAt: string;
}

interface PersistedPracticeSessionState {
  currentQuestionId: string | null;
  drafts: Record<string, AssessmentAnswerDraft>;
  questionSeenAtMs: Record<string, number>;
  revealedResults: Record<string, PersistedPracticeRevealState>;
  syncedDrafts: Record<string, AssessmentAnswerDraft>;
}

interface PracticeSessionStoreState {
  activeSessionId: string | null;
  sessions: Record<string, PersistedPracticeSessionState>;
}

interface PracticeSessionStoreActions {
  clearPracticeSession: (sessionId: string) => void;
  hydratePracticeSession: (
    sessionId: string,
    questions: PracticeSessionQuestion[],
  ) => void;
  markPracticeRevealResult: (
    sessionId: string,
    result: PracticeRevealResultResponse,
  ) => void;
  markPracticeAnswerSynced: (
    sessionId: string,
    questionId: string,
    draft: AssessmentAnswerDraft,
  ) => void;
  setPracticeCurrentQuestion: (
    sessionId: string,
    questionId: string | null,
  ) => void;
  setPracticeDraft: (
    sessionId: string,
    questionId: string,
    draft: AssessmentAnswerDraft,
  ) => void;
}

export type PracticeSessionStore = PracticeSessionStoreState &
  PracticeSessionStoreActions;

function buildSessionEntry(
  existing: PersistedPracticeSessionState | undefined,
  questions: PracticeSessionQuestion[],
) {
  const now = Date.now();
  const drafts = {
    ...(existing?.drafts ?? {}),
  };
  const syncedDrafts = {
    ...(existing?.syncedDrafts ?? {}),
  };
  const revealedResults = {
    ...(existing?.revealedResults ?? {}),
  };
  const questionSeenAtMs = {
    ...(existing?.questionSeenAtMs ?? {}),
  };

  for (const question of questions) {
    const serverDraft = normalizeAssessmentDraft(
      question.answerJson ?? question.latestSavedAnswerJson,
    );

    if (!drafts[question.questionId] || question.answeredAt) {
      drafts[question.questionId] = serverDraft;
    }

    syncedDrafts[question.questionId] = serverDraft;
    questionSeenAtMs[question.questionId] ??= now;
  }

  return {
    currentQuestionId:
      existing?.currentQuestionId ?? questions[0]?.questionId ?? null,
    drafts,
    questionSeenAtMs,
    revealedResults,
    syncedDrafts,
  } satisfies PersistedPracticeSessionState;
}

export const usePracticeSessionStore = create<PracticeSessionStore>()(
  persist(
    (set) => ({
      activeSessionId: null,
      sessions: {},
      clearPracticeSession: (sessionId) =>
        set((state) => {
          const nextSessions = {
            ...state.sessions,
          };
          delete nextSessions[sessionId];

          return {
            activeSessionId:
              state.activeSessionId === sessionId ? null : state.activeSessionId,
            sessions: nextSessions,
          };
        }),
      hydratePracticeSession: (sessionId, questions) =>
        set((state) => ({
          activeSessionId: sessionId,
          sessions: {
            ...state.sessions,
            [sessionId]: buildSessionEntry(state.sessions[sessionId], questions),
          },
        })),
      markPracticeRevealResult: (sessionId, result) =>
        set((state) => {
          const currentSession = state.sessions[sessionId];
          if (!currentSession) {
            return state;
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...currentSession,
                revealedResults: {
                  ...currentSession.revealedResults,
                  [result.questionId]: {
                    correctAnswerJson: result.correctAnswerJson,
                    explanationJson: result.explanationJson,
                    questionId: result.questionId,
                    revealedAt: result.revealedAt,
                  },
                },
              },
            },
          };
        }),
      markPracticeAnswerSynced: (sessionId, questionId, draft) =>
        set((state) => {
          const currentSession = state.sessions[sessionId];
          if (!currentSession) {
            return state;
          }

          const normalizedDraft = normalizeAssessmentDraft(draft);

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...currentSession,
                drafts: {
                  ...currentSession.drafts,
                  [questionId]: normalizedDraft,
                },
                syncedDrafts: {
                  ...currentSession.syncedDrafts,
                  [questionId]: normalizedDraft,
                },
              },
            },
          };
        }),
      setPracticeCurrentQuestion: (sessionId, questionId) =>
        set((state) => {
          const currentSession = state.sessions[sessionId];
          if (!currentSession) {
            return state;
          }

          return {
            activeSessionId: sessionId,
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...currentSession,
                currentQuestionId: questionId,
                questionSeenAtMs:
                  questionId === null
                    ? currentSession.questionSeenAtMs
                    : {
                        ...currentSession.questionSeenAtMs,
                        [questionId]:
                          currentSession.questionSeenAtMs[questionId] ??
                          Date.now(),
                      },
              },
            },
          };
        }),
      setPracticeDraft: (sessionId, questionId, draft) =>
        set((state) => {
          const currentSession = state.sessions[sessionId];
          if (!currentSession) {
            return state;
          }

          const normalizedDraft = normalizeAssessmentDraft(draft);
          const existingDraft = currentSession.drafts[questionId];
          if (areAssessmentDraftsEqual(existingDraft, normalizedDraft)) {
            return state;
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...currentSession,
                currentQuestionId: questionId,
                drafts: {
                  ...currentSession.drafts,
                  [questionId]: normalizedDraft,
                },
                questionSeenAtMs: {
                  ...currentSession.questionSeenAtMs,
                  [questionId]:
                    currentSession.questionSeenAtMs[questionId] ?? Date.now(),
                },
              },
            },
          };
        }),
    }),
    buildSessionPersistOptions<PracticeSessionStore>("practice-session", (state) => ({
      activeSessionId: state.activeSessionId,
      sessions: state.sessions,
    })),
  ),
);
