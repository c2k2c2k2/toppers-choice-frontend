"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
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

function readStringValue(value: unknown) {
  return typeof value === "string" ? value : "";
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

  const paginatedRows = useMemo(() => {
    const items = questionsQuery.data?.items ?? [];
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
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
            header: "Question",
            render: (row: QuestionSummary) => (
              <div>
                <p className="font-semibold text-[color:var(--brand)]">
                  {readStringValue(row.code) || row.id}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {row.subject.name}
                  {row.topic ? ` · ${row.topic.name}` : ""}
                </p>
              </div>
            ),
          },
          {
            header: "Type",
            className: "w-40",
            render: (row: QuestionSummary) => row.type.replaceAll("_", " "),
          },
          {
            header: "Difficulty",
            className: "w-32",
            render: (row: QuestionSummary) => row.difficulty,
          },
          {
            header: "Status",
            className: "w-32",
            render: (row: QuestionSummary) => row.status,
          },
          {
            header: "Updated",
            className: "w-44",
            render: (row: QuestionSummary) => formatAdminDateTime(row.updatedAt),
          },
          {
            header: "Actions",
            className: "w-60",
            render: (row: QuestionSummary) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tc-button-secondary"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/admin/questions/${row.id}`);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canPublishQuestions || publishMutation.isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMessage(null);
                    publishMutation.mutate({
                      action: row.status === "PUBLISHED" ? "unpublish" : "publish",
                      questionId: row.id,
                    });
                  }}
                >
                  {row.status === "PUBLISHED" ? "Move to draft" : "Publish"}
                </button>
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
