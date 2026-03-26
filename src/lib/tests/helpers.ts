import type {
  TestAttemptStatus,
  TestFamily,
} from "@/lib/tests/types";

export const TEST_FAMILY_OPTIONS: Array<{
  description: string;
  label: string;
  value: TestFamily;
}> = [
  {
    value: "MIXED",
    label: "Mixed",
    description: "Blend questions across the current track for broad revision.",
  },
  {
    value: "SUBJECT_WISE",
    label: "Subject-wise",
    description: "Stay inside one subject when you want tighter diagnosis.",
  },
  {
    value: "EXAM_STYLE",
    label: "Exam-style",
    description: "Mirror the rhythm and pressure of longer mock assessments.",
  },
];

export const TEST_ATTEMPT_STATUS_LABELS: Record<TestAttemptStatus, string> = {
  ACTIVE: "Active",
  SUBMITTED: "Submitted",
  AUTO_SUBMITTED: "Auto-submitted",
};

export function getTestFamilyLabel(family: TestFamily) {
  return TEST_FAMILY_OPTIONS.find((item) => item.value === family)?.label ?? family;
}

export function getTestAttemptStatusLabel(status: TestAttemptStatus) {
  return TEST_ATTEMPT_STATUS_LABELS[status] ?? status;
}
