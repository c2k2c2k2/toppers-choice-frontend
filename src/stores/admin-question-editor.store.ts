import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuestionDifficulty, QuestionType } from "@/lib/admin";
import { buildSessionPersistOptions } from "@/stores/persist-options";

export type QuestionLanguageMode = "ENGLISH" | "MARATHI" | "BILINGUAL";

export interface AdminQuestionEditorDefaults {
  difficulty: QuestionDifficulty;
  languageMode: QuestionLanguageMode;
  mediumId: string;
  subjectId: string;
  topicId: string;
  type: QuestionType;
}

interface AdminQuestionEditorActions {
  resetDefaults: () => void;
  setDefaults: (defaults: Partial<AdminQuestionEditorDefaults>) => void;
}

export type AdminQuestionEditorStore = AdminQuestionEditorDefaults &
  AdminQuestionEditorActions;

export const initialAdminQuestionEditorDefaults: AdminQuestionEditorDefaults = {
  difficulty: "MEDIUM",
  languageMode: "MARATHI",
  mediumId: "",
  subjectId: "",
  topicId: "",
  type: "SINGLE_CHOICE",
};

function buildResolvedDefaults(
  state: AdminQuestionEditorDefaults,
  defaults: Partial<AdminQuestionEditorDefaults>,
): AdminQuestionEditorDefaults {
  return {
    difficulty: defaults.difficulty ?? state.difficulty,
    languageMode: defaults.languageMode ?? state.languageMode,
    mediumId: defaults.mediumId ?? state.mediumId,
    subjectId: defaults.subjectId ?? state.subjectId,
    topicId: defaults.topicId ?? state.topicId,
    type: defaults.type ?? state.type,
  };
}

function hasSameDefaults(
  left: AdminQuestionEditorDefaults,
  right: AdminQuestionEditorDefaults,
) {
  return (
    left.difficulty === right.difficulty &&
    left.languageMode === right.languageMode &&
    left.mediumId === right.mediumId &&
    left.subjectId === right.subjectId &&
    left.topicId === right.topicId &&
    left.type === right.type
  );
}

export const useAdminQuestionEditorStore = create<AdminQuestionEditorStore>()(
  persist(
    (set) => ({
      ...initialAdminQuestionEditorDefaults,
      resetDefaults: () =>
        set((state) =>
          hasSameDefaults(state, initialAdminQuestionEditorDefaults)
            ? state
            : initialAdminQuestionEditorDefaults,
        ),
      setDefaults: (defaults) =>
        set((state) => {
          const nextDefaults = buildResolvedDefaults(state, defaults);
          return hasSameDefaults(state, nextDefaults) ? state : nextDefaults;
        }),
    }),
    buildSessionPersistOptions<AdminQuestionEditorStore>(
      "admin-question-editor",
      (state) => ({
        difficulty: state.difficulty,
        languageMode: state.languageMode,
        mediumId: state.mediumId,
        subjectId: state.subjectId,
        topicId: state.topicId,
        type: state.type,
      }),
    ),
  ),
);
