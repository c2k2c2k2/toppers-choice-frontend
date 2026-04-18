"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  deleteAdminQuestion,
  formatAdminDateTime,
  getApiErrorMessage,
  listAdminQuestions,
  publishAdminQuestion,
  unpublishAdminQuestion,
  type QuestionDifficulty,
  type QuestionStatus,
  type QuestionSummary,
  type QuestionType,
} from "@/lib/admin";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminRouteTabs } from "@/components/admin/admin-route-tabs";
import { AdminSelect } from "@/components/admin/admin-form-field";
import { useAdminTaxonomyReferenceData } from "@/components/admin/use-admin-taxonomy-reference-data";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";

const PAGE_SIZE = 12;
const QUESTION_STATUS_OPTIONS: Array<QuestionStatus | ""> = [
  "",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
];
const QUESTION_TYPE_OPTIONS: Array<QuestionType | ""> = [
  "",
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TEXT_INPUT",
];
const QUESTION_DIFFICULTY_OPTIONS: Array<QuestionDifficulty | ""> = [
  "",
  "EASY",
  "MEDIUM",
  "HARD",
];
const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "Single choice",
  MULTIPLE_CHOICE: "Multiple choice",
  TEXT_INPUT: "Text input",
};

type QuestionTableRow = QuestionSummary & {
  serialNumber: number;
};

function readStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function formatQuestionTypeLabel(value: QuestionType) {
  return QUESTION_TYPE_LABELS[value];
}

function actionButtonClass(tone: "default" | "danger" = "default") {
  return [
    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-[color:var(--brand)] transition-colors",
    tone === "danger"
      ? "border-[rgba(163,39,32,0.16)] bg-[rgba(255,244,242,0.92)] hover:bg-[rgba(255,234,231,0.98)]"
      : "border-[rgba(0,30,64,0.1)] bg-white hover:bg-[rgba(0,51,102,0.04)]",
    "disabled:cursor-not-allowed disabled:opacity-45",
  ].join(" ");
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.167 15.833h2.083l8.125-8.125-2.083-2.083-8.125 8.125v2.083Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m11.875 5.625 2.083 2.083"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PublishIcon({ published }: Readonly<{ published: boolean }>) {
  return published ? (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 4.167v11.666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m6.25 7.917 3.75-3.75 3.75 3.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M4.167 15.833h11.666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10 15.833V4.167"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m13.75 12.083-3.75 3.75-3.75-3.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M4.167 4.167h11.666"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.833 6.25v8.333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.167 6.25v8.333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3.75 4.167h12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M7.5 4.167V3.333h5v.834"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M5 6.25h10l-.583 10H5.583L5 6.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function AdminQuestionsListScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const taxonomy = useAdminTaxonomyReferenceData();
  const authSession = useAuthSession();
  const canReadQuestions = authSession.hasPermission("academics.questions.read");
  const canManageQuestions = authSession.hasPermission("academics.questions.manage");
  const canPublishQuestions = authSession.hasPermission("academics.questions.publish");
  const [searchValue, setSearchValue] = useState("");
  const [status, setStatus] = useState<QuestionStatus | "">("");
  const [type, setType] = useState<QuestionType | "">("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | "">("");
  const [subjectId, setSubjectId] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const questionsQuery = useAuthenticatedQuery({
    enabled: canReadQuestions,
    queryFn: (accessToken) =>
      listAdminQuestions(accessToken, {
        difficulty: difficulty || undefined,
        search: searchValue.trim() || undefined,
        status: status || undefined,
        subjectId: subjectId || undefined,
        type: type || undefined,
      }),
    queryKey: adminQueryKeys.questions({
      difficulty: difficulty || null,
      search: searchValue.trim() || null,
      status: status || null,
      subjectId: subjectId || null,
      type: type || null,
    }),
    staleTime: 15_000,
  });

  const publishMutation = useAuthenticatedMutation({
    mutationFn: (
      input: {
        action: "publish" | "unpublish";
        questionId: string;
      },
      accessToken,
    ) =>
      input.action === "publish"
        ? publishAdminQuestion(input.questionId, accessToken)
        : unpublishAdminQuestion(input.questionId, accessToken),
    onSuccess: async (_, variables) => {
      setMessage(
        variables.action === "publish"
          ? "Question published."
          : "Question moved back to draft.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["admin", "questions"],
      });
    },
  });
  const deleteMutation = useAuthenticatedMutation({
    mutationFn: (questionId: string, accessToken) =>
      deleteAdminQuestion(questionId, accessToken),
    onSuccess: async (response) => {
      setMessage(response.message);
      await queryClient.invalidateQueries({
        queryKey: ["admin", "questions"],
      });
    },
  });

  async function handleDeleteQuestion(row: QuestionSummary) {
    const questionLabel = readStringValue(row.statementPreviewText) || row.id;
    const confirmed = window.confirm(
      `Delete this question?\n\n${questionLabel}\n\nThis only works if the question has not already been used in practice or tests.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    await deleteMutation.mutateAsync(row.id);
  }

  const paginatedRows = useMemo<QuestionTableRow[]>(() => {
    const items = questionsQuery.data?.items ?? [];
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE).map((item, index) => ({
      ...item,
      serialNumber: start + index + 1,
    }));
  }, [questionsQuery.data?.items, page]);

  if (!canReadQuestions) {
    return (
      <EmptyState
        eyebrow="Question bank"
        title="This session cannot open the question bank."
        description="Ask an administrator to grant question access to this account."
      />
    );
  }

  if (questionsQuery.isLoading || taxonomy.isLoading) {
    return (
      <LoadingState
        title="Preparing question bank"
        description="Loading the question listing, taxonomy filters, and publish controls."
      />
    );
  }

  if (questionsQuery.isError) {
    return (
      <ErrorState
        title="The question bank could not load."
        description="We couldn't finish loading the question listing."
        onRetry={() => void questionsQuery.refetch()}
      />
    );
  }

  const allRows = questionsQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Assessment management"
        title="Question bank"
        description="Review the full question list here, then open a dedicated page to create or edit one question at a time."
        actions={
          canManageQuestions ? (
            <Link href="/admin/questions/new" className="tc-button-primary">
              Create question
            </Link>
          ) : null
        }
      />

      <AdminRouteTabs
        activeHref="/admin/questions"
        items={[
          {
            href: "/admin/questions",
            label: "Questions",
            description: "The question bank and publishing controls.",
          },
          {
            href: "/admin/tests",
            label: "Tests",
            description: "Test papers and question collections.",
          },
        ]}
      />

      <AdminFilterBar
        searchValue={searchValue}
        onSearchValueChange={(value) => {
          setPage(1);
          setSearchValue(value);
        }}
        searchPlaceholder="Search by code or statement"
        resultSummary={`${allRows.length} questions found`}
      >
        <AdminSelect
          label="Status"
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as QuestionStatus | "");
          }}
        >
          <option value="">All statuses</option>
          {QUESTION_STATUS_OPTIONS.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Type"
          value={type}
          onChange={(event) => {
            setPage(1);
            setType(event.target.value as QuestionType | "");
          }}
        >
          <option value="">All types</option>
          {QUESTION_TYPE_OPTIONS.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              {option.replaceAll("_", " ")}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Difficulty"
          value={difficulty}
          onChange={(event) => {
            setPage(1);
            setDifficulty(event.target.value as QuestionDifficulty | "");
          }}
        >
          <option value="">All levels</option>
          {QUESTION_DIFFICULTY_OPTIONS.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Subject"
          value={subjectId}
          onChange={(event) => {
            setPage(1);
            setSubjectId(event.target.value);
          }}
        >
          <option value="">All subjects</option>
          {taxonomy.subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </AdminSelect>
      </AdminFilterBar>

      {message ? <AdminInlineNotice tone="success">{message}</AdminInlineNotice> : null}

      {publishMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            publishMutation.error,
            "The question publication state could not be updated.",
          )}
        </AdminInlineNotice>
      ) : null}

      {deleteMutation.error ? (
        <AdminInlineNotice tone="warning">
          {getApiErrorMessage(
            deleteMutation.error,
            "The question could not be deleted.",
          )}
        </AdminInlineNotice>
      ) : null}

      <AdminDataTable
        rows={paginatedRows}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/questions/${row.id}`)}
        emptyState={
          <EmptyState
            eyebrow="Question bank"
            title="No questions matched these filters."
            description="Change the filters or create the first question for this subject."
          />
        }
        columns={[
          {
            header: "#",
            className: "w-16 whitespace-nowrap",
            render: (row: QuestionTableRow) => (
              <span className="font-mono text-xs font-semibold text-[color:var(--muted)]">
                {row.serialNumber}
              </span>
            ),
          },
          {
            header: "Question",
            className: "w-[18rem] xl:w-[20rem]",
            render: (row: QuestionTableRow) => (
              <div className="w-[18rem] max-w-[18rem] xl:w-[20rem] xl:max-w-[20rem]">
                <p
                  className="truncate font-semibold leading-5 text-[color:var(--brand)]"
                  title={readStringValue(row.statementPreviewText)}
                >
                  {readStringValue(row.statementPreviewText) || row.id}
                </p>
                <p
                  className="mt-1 truncate text-xs text-[color:var(--muted)]"
                  title={[
                    row.subject.name,
                    row.topic?.name ?? "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                >
                  {row.subject.name}
                  {row.topic ? ` · ${row.topic.name}` : ""}
                </p>
              </div>
            ),
          },
          {
            header: "Code",
            className: "w-44 whitespace-nowrap",
            render: (row: QuestionTableRow) => (
              <span
                className="font-mono text-xs font-semibold text-[color:var(--muted)]"
                title={readStringValue(row.code) || row.id}
              >
                {readStringValue(row.code) || "--"}
              </span>
            ),
          },
          {
            header: "Type",
            className: "w-36",
            render: (row: QuestionTableRow) => formatQuestionTypeLabel(row.type),
          },
          {
            header: "Level",
            className: "w-28 whitespace-nowrap",
            render: (row: QuestionTableRow) => row.difficulty,
          },
          {
            header: "Status",
            className: "w-28 whitespace-nowrap",
            render: (row: QuestionTableRow) => row.status,
          },
          {
            header: "Updated",
            className: "w-44",
            render: (row: QuestionTableRow) => formatAdminDateTime(row.updatedAt),
          },
          {
            header: "Actions",
            className: "w-40 whitespace-nowrap",
            render: (row: QuestionTableRow) => (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Edit question"
                  className={actionButtonClass()}
                  disabled={deleteMutation.isPending}
                  title="Edit question"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/admin/questions/${row.id}`);
                  }}
                >
                  <EditIcon />
                  <span className="sr-only">Edit question</span>
                </button>
                <button
                  type="button"
                  aria-label={
                    row.status === "PUBLISHED"
                      ? "Move question to draft"
                      : "Publish question"
                  }
                  className={actionButtonClass()}
                  disabled={
                    !canPublishQuestions ||
                    publishMutation.isPending ||
                    deleteMutation.isPending
                  }
                  title={
                    row.status === "PUBLISHED"
                      ? "Move question to draft"
                      : "Publish question"
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setMessage(null);
                    publishMutation.mutate({
                      action: row.status === "PUBLISHED" ? "unpublish" : "publish",
                      questionId: row.id,
                    });
                  }}
                >
                  <PublishIcon published={row.status === "PUBLISHED"} />
                  <span className="sr-only">
                    {row.status === "PUBLISHED"
                      ? "Move question to draft"
                      : "Publish question"}
                  </span>
                </button>
                {canManageQuestions ? (
                  <button
                    type="button"
                    aria-label="Delete question"
                    className={actionButtonClass("danger")}
                    disabled={publishMutation.isPending || deleteMutation.isPending}
                    title="Delete question"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteQuestion(row);
                    }}
                  >
                    <DeleteIcon />
                    <span className="sr-only">Delete question</span>
                  </button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <AdminPagination
        currentPage={page}
        onPageChange={setPage}
        pageSize={PAGE_SIZE}
        totalItems={allRows.length}
      />
    </div>
  );
}
