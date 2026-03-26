import type {
  PracticeMode,
  PracticeSessionStatus,
} from "@/lib/practice/types";

export const PRACTICE_MODE_OPTIONS: Array<{
  description: string;
  label: string;
  value: PracticeMode;
}> = [
  {
    value: "MIXED",
    label: "Mixed practice",
    description:
      "Blend questions across the selected study scope for revision-heavy practice.",
  },
  {
    value: "TOPIC_WISE",
    label: "Topic-wise focus",
    description:
      "Stay inside one topic when you want deliberate repetition and weak-area repair.",
  },
];

export const PRACTICE_STATUS_LABELS: Record<PracticeSessionStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

export function getPracticeModeLabel(mode: PracticeMode) {
  return PRACTICE_MODE_OPTIONS.find((item) => item.value === mode)?.label ?? mode;
}

export function getPracticeSessionSummaryLabel(status: PracticeSessionStatus) {
  return PRACTICE_STATUS_LABELS[status] ?? status;
}
