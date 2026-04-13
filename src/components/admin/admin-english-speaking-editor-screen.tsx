"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  createAdminEnglishSpeakingTopic,
  deleteAdminEnglishSpeakingTopic,
  finalizeAdminEnglishSpeakingSentenceAudio,
  formatAdminDateTime,
  generateAdminEnglishSpeakingSentenceAudio,
  getAdminEnglishSpeakingTopic,
  getApiErrorMessage,
  publishAdminEnglishSpeakingTopic,
  updateAdminEnglishSpeakingTopic,
  unpublishAdminEnglishSpeakingTopic,
} from "@/lib/admin";
import { parseImportedEnglishSpeakingTopicDraft } from "@/lib/admin/english-speaking-helpers";
import { parseOptionalInteger } from "@/lib/admin/helpers";
import {
  createEmptyEnglishSpeakingSentence,
  ENGLISH_SPEAKING_LANGUAGE_ORDER,
  fetchEnglishSpeakingAudioBlob,
  getAudioStateForLanguage,
  getEnglishSpeakingLanguageLabel,
  type AdminEnglishSpeakingAudioState,
  type AdminEnglishSpeakingTopicDetail,
  type EnglishSpeakingTopicAccessType,
  type EnglishSpeakingTopicStatus,
  type EnglishSpeakingTopicVisibility,
  type UpsertEnglishSpeakingSentenceInput,
} from "@/lib/english-speaking";
import { AdminDialogShell } from "@/components/admin/admin-dialog-shell";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/admin-form-field";
import { AdminInlineNotice } from "@/components/admin/admin-inline-notice";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToneBadge, AdminVisibilityBadge } from "@/components/admin/admin-status-badge";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { TextContent } from "@/components/primitives/text-content";

type EditorSentence = {
  clientId: string;
  englishText: string;
  hindiText: string;
  id?: string;
  marathiText: string;
  orderIndex: string;
};

type TopicFormState = {
  accessType: EnglishSpeakingTopicAccessType;
  description: string;
  orderIndex: string;
  sentences: EditorSentence[];
  slug: string;
  title: string;
  visibility: EnglishSpeakingTopicVisibility;
};

type TopicComparisonSnapshot = {
  accessType: EnglishSpeakingTopicAccessType;
  description: string;
  orderIndex: number | null;
  sentences: UpsertEnglishSpeakingSentenceInput[];
  slug: string;
  title: string;
  visibility: EnglishSpeakingTopicVisibility;
};

type BatchAction = "generate" | "finalize";

type BatchProgress = {
  action: BatchAction;
  completed: number;
  currentSentenceLabel: string | null;
  skipped: number;
  total: number;
};

const ACCESS_OPTIONS: EnglishSpeakingTopicAccessType[] = ["FREE", "PREMIUM"];
const VISIBILITY_OPTIONS: EnglishSpeakingTopicVisibility[] = [
  "AUTHENTICATED",
  "PUBLIC",
  "INTERNAL",
];

const EMPTY_TOPIC_SNAPSHOT: TopicComparisonSnapshot = {
  accessType: "FREE",
  description: "",
  orderIndex: null,
  sentences: [],
  slug: "",
  title: "",
  visibility: "AUTHENTICATED",
};

function getEnglishSpeakingDetailQueryKey(topicId: string | null) {
  return ["admin", "english-speaking", "detail", topicId ?? "new"] as const;
}

function getTopicStatusTone(status: EnglishSpeakingTopicStatus) {
  return status === "PUBLISHED"
    ? "live"
    : status === "ARCHIVED"
      ? "danger"
      : "warning";
}

function getAccessTone(accessType: EnglishSpeakingTopicAccessType) {
  return accessType === "PREMIUM" ? "warning" : "info";
}

function createSentenceDraft(
  input: UpsertEnglishSpeakingSentenceInput,
  index: number,
): EditorSentence {
  return {
    clientId: input.id ?? crypto.randomUUID(),
    englishText: input.englishText,
    hindiText: input.hindiText,
    id: input.id,
    marathiText: input.marathiText,
    orderIndex: String(input.orderIndex ?? (index + 1) * 10),
  };
}

function buildTopicFormState(topic: AdminEnglishSpeakingTopicDetail | null): TopicFormState {
  if (!topic) {
    return {
      accessType: "FREE",
      description: "",
      orderIndex: "",
      sentences: [createSentenceDraft(createEmptyEnglishSpeakingSentence(10), 0)],
      slug: "",
      title: "",
      visibility: "AUTHENTICATED",
    };
  }

  return {
    accessType: topic.accessType,
    description: topic.description ?? "",
    orderIndex: String(topic.orderIndex),
    sentences:
      topic.sentences.length > 0
        ? topic.sentences.map((sentence, index) =>
            createSentenceDraft(sentence, index),
          )
        : [createSentenceDraft(createEmptyEnglishSpeakingSentence(10), 0)],
    slug: topic.slug,
    title: topic.title,
    visibility: topic.visibility,
  };
}

function serializeSentences(sentences: EditorSentence[]) {
  return sentences
    .filter((sentence) => {
      const fields = [
        sentence.hindiText.trim(),
        sentence.marathiText.trim(),
        sentence.englishText.trim(),
      ];
      return sentence.id || fields.some(Boolean);
    })
    .map((sentence, index) => ({
      englishText: sentence.englishText.trim(),
      hindiText: sentence.hindiText.trim(),
      id: sentence.id,
      marathiText: sentence.marathiText.trim(),
      orderIndex: parseOptionalInteger(sentence.orderIndex) ?? (index + 1) * 10,
    }));
}

function buildTopicSnapshotFromForm(formState: TopicFormState): TopicComparisonSnapshot {
  return {
    accessType: formState.accessType,
    description: formState.description.trim(),
    orderIndex: parseOptionalInteger(formState.orderIndex) ?? null,
    sentences: serializeSentences(formState.sentences),
    slug: formState.slug.trim(),
    title: formState.title.trim(),
    visibility: formState.visibility,
  };
}

function buildTopicSnapshotFromTopic(topic: AdminEnglishSpeakingTopicDetail | null) {
  if (!topic) {
    return EMPTY_TOPIC_SNAPSHOT;
  }

  return {
    accessType: topic.accessType,
    description: topic.description ?? "",
    orderIndex: topic.orderIndex,
    sentences: topic.sentences.map((sentence) => ({
      englishText: sentence.englishText,
      hindiText: sentence.hindiText,
      id: sentence.id,
      marathiText: sentence.marathiText,
      orderIndex: sentence.orderIndex,
    })),
    slug: topic.slug,
    title: topic.title,
    visibility: topic.visibility,
  } satisfies TopicComparisonSnapshot;
}

function getAudioTone(audioState: AdminEnglishSpeakingAudioState | null) {
  if (!audioState) {
    return "neutral" as const;
  }

  if (audioState.lastError) {
    return "danger" as const;
  }

  if (!audioState.isCurrent && audioState.hasFinalized) {
    return "warning" as const;
  }

  if (audioState.hasPreview) {
    return "info" as const;
  }

  if (audioState.hasFinalized) {
    return "live" as const;
  }

  return "neutral" as const;
}

function getAudioLabel(audioState: AdminEnglishSpeakingAudioState | null) {
  if (!audioState) {
    return "Not generated";
  }

  if (audioState.lastError) {
    return "Retry needed";
  }

  if (!audioState.isCurrent && audioState.hasFinalized) {
    return "Outdated";
  }

  if (audioState.hasPreview) {
    return "Preview ready";
  }

  if (audioState.hasFinalized) {
    return "Finalized";
  }

  return "Not generated";
}

function WorkspaceStatCard({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string | number;
}>) {
  return (
    <section className="tc-admin-frame-subtle rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-[color:var(--brand)]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
        {detail}
      </p>
    </section>
  );
}

function AudioPreviewButton({
  disabled,
  label,
  path,
}: Readonly<{
  disabled?: boolean;
  label: string;
  path: string | null;
}>) {
  const authSession = useAuthSession();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  async function handlePlay() {
    if (!path || disabled) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const accessToken = await authSession.ensureAccessToken();

      if (!accessToken) {
        throw new Error("An active session is required to play topic audio.");
      }

      const blob = await fetchEnglishSpeakingAudioBlob(path, accessToken);
      const objectUrl = URL.createObjectURL(blob);

      setAudioUrl((previousUrl) => {
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return objectUrl;
      });

      if (audioElementRef.current) {
        audioElementRef.current.src = objectUrl;
        audioElementRef.current.currentTime = 0;
        await audioElementRef.current.play();
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "The requested audio could not be played.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        className="tc-button-secondary"
        disabled={disabled || !path || isLoading}
        onClick={() => void handlePlay()}
      >
        {isLoading ? "Loading..." : label}
      </button>
      <audio ref={audioElementRef} className="hidden" />
      {error ? (
        <p className="text-xs leading-5 text-[#8b2026]">{error}</p>
      ) : null}
    </div>
  );
}

export function AdminEnglishSpeakingEditorScreen({
  topicId = null,
}: Readonly<{
  topicId?: string | null;
}>) {
  const authSession = useAuthSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isCreatingTopic = !topicId;
  const [formState, setFormState] = useState<TopicFormState>(() =>
    buildTopicFormState(null),
  );
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importValue, setImportValue] = useState("");
  const [importTitleOverride, setImportTitleOverride] = useState("");
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [expandedSentenceKey, setExpandedSentenceKey] = useState<string | null>(
    () => buildTopicFormState(null).sentences[0]?.clientId ?? null,
  );

  const detailQuery = useAuthenticatedQuery({
    enabled: Boolean(topicId),
    queryFn: (accessToken) =>
      getAdminEnglishSpeakingTopic(topicId ?? "", accessToken),
    queryKey: getEnglishSpeakingDetailQueryKey(topicId),
    refetchOnWindowFocus: false,
    staleTime: 15_000,
  });

  const loadedTopic = detailQuery.data;

  useEffect(() => {
    if (!loadedTopic) {
      return;
    }

    const nextState = buildTopicFormState(loadedTopic);
    setFormState(nextState);
    setExpandedSentenceKey(nextState.sentences[0]?.clientId ?? null);
    setPageMessage(null);
  }, [loadedTopic]);

  useEffect(() => {
    if (topicId) {
      return;
    }

    const nextState = buildTopicFormState(null);
    setFormState(nextState);
    setExpandedSentenceKey(nextState.sentences[0]?.clientId ?? null);
  }, [topicId]);

  useEffect(() => {
    if (
      expandedSentenceKey &&
      formState.sentences.some((sentence) => sentence.clientId === expandedSentenceKey)
    ) {
      return;
    }

    setExpandedSentenceKey(formState.sentences[0]?.clientId ?? null);
  }, [expandedSentenceKey, formState.sentences]);

  const currentTopic = loadedTopic ?? null;
  const formSnapshot = useMemo(
    () => buildTopicSnapshotFromForm(formState),
    [formState],
  );
  const persistedSnapshot = useMemo(
    () => buildTopicSnapshotFromTopic(currentTopic),
    [currentTopic],
  );
  const hasUnsavedChanges = useMemo(
    () =>
      JSON.stringify(formSnapshot) !== JSON.stringify(
        currentTopic ? persistedSnapshot : EMPTY_TOPIC_SNAPSHOT,
      ),
    [currentTopic, formSnapshot, persistedSnapshot],
  );

  function syncTopicState(
    topic: AdminEnglishSpeakingTopicDetail,
    options: {
      invalidateList?: boolean;
      message?: string | null;
    } = {},
  ) {
    const nextState = buildTopicFormState(topic);
    setFormState(nextState);
    setExpandedSentenceKey((current) => {
      if (current && nextState.sentences.some((sentence) => sentence.clientId === current)) {
        return current;
      }

      const persistedMatch = nextState.sentences.find(
        (sentence) => sentence.id && sentence.id === current,
      );

      return persistedMatch?.clientId ?? nextState.sentences[0]?.clientId ?? null;
    });
    if (options.message !== undefined) {
      setPageMessage(options.message);
    }
    void queryClient.setQueryData(
      getEnglishSpeakingDetailQueryKey(topic.id),
      topic,
    );
    if (options.invalidateList ?? true) {
      void queryClient.invalidateQueries({ queryKey: ["admin", "english-speaking"] });
    }
  }

  const saveTopicMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const payload = {
        accessType: formState.accessType,
        description: formState.description.trim() || undefined,
        orderIndex: parseOptionalInteger(formState.orderIndex),
        sentences: serializeSentences(formState.sentences),
        slug: formState.slug.trim() || undefined,
        title: formState.title.trim(),
        visibility: formState.visibility,
      };

      if (!payload.title) {
        throw new Error("Topic title is required.");
      }

      return topicId
        ? updateAdminEnglishSpeakingTopic(topicId, payload, accessToken)
        : createAdminEnglishSpeakingTopic(payload, accessToken);
    },
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "Topic changes could not be saved."),
      );
    },
    onSuccess: (topic) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "english-speaking"] });
      void queryClient.setQueryData(
        getEnglishSpeakingDetailQueryKey(topic.id),
        topic,
      );

      if (!topicId) {
        router.replace(`/admin/english-speaking/${encodeURIComponent(topic.id)}`);
        return;
      }

      syncTopicState(topic, { message: "Topic changes were saved." });
    },
  });

  const publishTopicMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!topicId) {
        throw new Error("Save the topic before publishing it.");
      }

      return publishAdminEnglishSpeakingTopic(topicId, accessToken);
    },
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "The topic could not be published."),
      );
    },
    onSuccess: (topic) =>
      syncTopicState(topic, {
        message: "Topic is now published for students.",
      }),
  });

  const unpublishTopicMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!topicId) {
        throw new Error("Save the topic before updating its publish state.");
      }

      return unpublishAdminEnglishSpeakingTopic(topicId, accessToken);
    },
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "The topic could not be moved back to draft."),
      );
    },
    onSuccess: (topic) =>
      syncTopicState(topic, { message: "Topic was moved back to draft." }),
  });

  const deleteTopicMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      if (!topicId) {
        throw new Error("Only saved topics can be deleted.");
      }

      return deleteAdminEnglishSpeakingTopic(topicId, accessToken);
    },
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "The topic could not be deleted."),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "english-speaking"] });
      router.push("/admin/english-speaking");
    },
  });

  const generateSentenceAudioMutation = useAuthenticatedMutation({
    mutationFn: (sentenceId: string, accessToken) =>
      generateAdminEnglishSpeakingSentenceAudio(sentenceId, {}, accessToken),
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "Sentence preview audio could not be generated."),
      );
    },
    onSuccess: (topic) =>
      syncTopicState(topic, {
        message: "Preview audio was regenerated for the selected sentence.",
      }),
  });

  const finalizeSentenceAudioMutation = useAuthenticatedMutation({
    mutationFn: (sentenceId: string, accessToken) =>
      finalizeAdminEnglishSpeakingSentenceAudio(sentenceId, {}, accessToken),
    onError: (error) => {
      setPageMessage(
        getApiErrorMessage(error, "Sentence audio could not be finalized."),
      );
    },
    onSuccess: (topic) =>
      syncTopicState(topic, {
        message: "Sentence audio was finalized for student playback.",
      }),
  });

  function updateSentence(clientId: string, patch: Partial<EditorSentence>) {
    setFormState((current) => ({
      ...current,
      sentences: current.sentences.map((sentence) =>
        sentence.clientId === clientId ? { ...sentence, ...patch } : sentence,
      ),
    }));
  }

  function addSentence() {
    const nextDraft = createSentenceDraft(
      createEmptyEnglishSpeakingSentence((formState.sentences.length + 1) * 10),
      formState.sentences.length,
    );

    setFormState((current) => ({
      ...current,
      sentences: [...current.sentences, nextDraft],
    }));
    setExpandedSentenceKey(nextDraft.clientId);
  }

  function removeSentence(clientId: string) {
    setFormState((current) => {
      const nextSentences = current.sentences.filter(
        (sentence) => sentence.clientId !== clientId,
      );

      if (nextSentences.length === 0) {
        return {
          ...current,
          sentences: [createSentenceDraft(createEmptyEnglishSpeakingSentence(10), 0)],
        };
      }

      return {
        ...current,
        sentences: nextSentences,
      };
    });
  }

  function applyImportedTopicDraft() {
    try {
      const imported = parseImportedEnglishSpeakingTopicDraft(importValue);
      const nextTitle =
        importTitleOverride.trim() || formState.title.trim() || imported.title;

      if (!nextTitle) {
        throw new Error(
          "The imported JSON does not include a title. Add a title override before applying it.",
        );
      }

      const nextSentences = imported.sentences.map((sentence, index) =>
        createSentenceDraft(sentence, index),
      );

      setFormState((current) => ({
        ...current,
        sentences: nextSentences,
        title: nextTitle,
      }));
      setExpandedSentenceKey(nextSentences[0]?.clientId ?? null);
      setImportValue("");
      setImportTitleOverride("");
      setIsImportDialogOpen(false);
      setPageMessage("Imported sentences are ready to review and save.");
    } catch (error) {
      setPageMessage(
        getApiErrorMessage(error, "The import data could not be parsed."),
      );
    }
  }

  async function handleDeleteTopic() {
    const confirmed = window.confirm(
      "Delete this topic and every generated audio file linked to it?",
    );

    if (!confirmed) {
      return;
    }

    await deleteTopicMutation.mutateAsync();
  }

  async function runTopicBatch(action: BatchAction) {
    if (!currentTopic) {
      setPageMessage("Save the topic before starting a batch run.");
      return;
    }

    if (hasUnsavedChanges) {
      setPageMessage(
        "Save the latest sentence edits first. Batch audio actions only run against the saved topic state.",
      );
      return;
    }

    const accessToken = await authSession.ensureAccessToken();

    if (!accessToken) {
      setPageMessage("An active admin session is required to run batch audio actions.");
      return;
    }

    const allSentences = currentTopic.sentences;
    const queuedSentences =
      action === "generate"
        ? allSentences
        : allSentences.filter((sentence) =>
            ENGLISH_SPEAKING_LANGUAGE_ORDER.every((language) => {
              const audioState = getAudioStateForLanguage(sentence, language);
              return Boolean(audioState?.hasPreview && audioState.isCurrent);
            }),
          );

    const skipped = allSentences.length - queuedSentences.length;

    if (queuedSentences.length === 0) {
      setPageMessage(
        action === "generate"
          ? "No saved sentences are available for preview generation."
          : "No sentences have a full current preview set yet, so there is nothing to finalize in batch.",
      );
      return;
    }

    setPageMessage(null);
    setBatchProgress({
      action,
      completed: 0,
      currentSentenceLabel: null,
      skipped,
      total: queuedSentences.length,
    });

    let processedCount = 0;

    try {
      let latestTopic = currentTopic;

      for (const [index, sentence] of queuedSentences.entries()) {
        const sentenceLabel = `Sentence ${String(sentence.orderIndex).padStart(2, "0")}`;

        setBatchProgress({
          action,
          completed: index,
          currentSentenceLabel: sentenceLabel,
          skipped,
          total: queuedSentences.length,
        });

        latestTopic =
          action === "generate"
            ? await generateAdminEnglishSpeakingSentenceAudio(
                sentence.id,
                {},
                accessToken,
              )
            : await finalizeAdminEnglishSpeakingSentenceAudio(
                sentence.id,
                {},
                accessToken,
              );

        syncTopicState(latestTopic, {
          invalidateList: false,
          message: null,
        });
        processedCount = index + 1;

        setBatchProgress({
          action,
          completed: processedCount,
          currentSentenceLabel: sentenceLabel,
          skipped,
          total: queuedSentences.length,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "english-speaking"] });

      setPageMessage(
        action === "generate"
          ? `Generated previews for ${queuedSentences.length} sentence${queuedSentences.length === 1 ? "" : "s"} one by one.${skipped > 0 ? ` Skipped ${skipped} sentence${skipped === 1 ? "" : "s"} during this run.` : ""}`
          : `Finalized audio for ${queuedSentences.length} sentence${queuedSentences.length === 1 ? "" : "s"} one by one.${skipped > 0 ? ` Skipped ${skipped} sentence${skipped === 1 ? "" : "s"} that were not ready.` : ""}`,
      );
    } catch (error) {
      const fallback =
        action === "generate"
          ? "Batch preview generation stopped before completion."
          : "Batch finalize stopped before completion.";

      setPageMessage(
        `${getApiErrorMessage(error, fallback)} Processed ${processedCount}/${queuedSentences.length} sentence${queuedSentences.length === 1 ? "" : "s"}.`,
      );
    } finally {
      setBatchProgress(null);
    }
  }

  if (detailQuery.isError) {
    return (
      <ErrorState
        title="This English speaking topic could not load."
        description="The editor could not fetch the latest sentence deck and audio state."
        onRetry={() => void detailQuery.refetch()}
      />
    );
  }

  if (!isCreatingTopic && (detailQuery.isLoading || !detailQuery.data)) {
    return (
      <LoadingState
        title="Preparing topic editor"
        description="Loading the topic metadata, sentence deck, and audio readiness state."
      />
    );
  }

  const isBusy =
    saveTopicMutation.isPending ||
    publishTopicMutation.isPending ||
    unpublishTopicMutation.isPending ||
    deleteTopicMutation.isPending ||
    Boolean(batchProgress) ||
    generateSentenceAudioMutation.isPending ||
    finalizeSentenceAudioMutation.isPending;
  const topicActionDisabled = !currentTopic || isBusy || hasUnsavedChanges;
  const readySentenceCount = currentTopic?.readySentenceCount ?? 0;
  const sentenceCount = currentTopic?.sentenceCount ?? serializeSentences(formState.sentences).length;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        eyebrow="Audio-first content"
        title={isCreatingTopic ? "New English speaking topic" : currentTopic?.title ?? "English speaking topic"}
        description="This editor stays on one calm column: save the topic details, import JSON through a popup when needed, then work through the sentence deck with focused preview and finalize controls."
        actions={
          <>
            <Link href="/admin/english-speaking" className="tc-button-secondary">
              Back to library
            </Link>
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() => setIsImportDialogOpen(true)}
            >
              Import JSON
            </button>
            <button
              type="button"
              className="tc-button-primary"
              disabled={isBusy}
              onClick={() => void saveTopicMutation.mutateAsync()}
            >
              {saveTopicMutation.isPending
                ? "Saving..."
                : isCreatingTopic
                  ? "Create topic"
                  : "Save changes"}
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <WorkspaceStatCard
          label="Topic status"
          value={currentTopic?.status ?? "Draft"}
          detail={
            currentTopic
              ? `Published ${formatAdminDateTime(currentTopic.publishedAt)}`
              : "Create the topic shell first, then preview and finalize audio."
          }
        />
        <WorkspaceStatCard
          label="Sentence deck"
          value={sentenceCount}
          detail="Each sentence carries Hindi, Marathi, and English text plus its own preview/final audio trail."
        />
        <WorkspaceStatCard
          label="Ready audio"
          value={`${readySentenceCount}/${sentenceCount || 0}`}
          detail="Current finalized tracks that are ready for publish-time validation."
        />
      </section>

      {batchProgress ? (
        <AdminInlineNotice>
          {batchProgress.action === "generate"
            ? "Generating previews"
            : "Finalizing audio"}{" "}
          {batchProgress.completed}/{batchProgress.total}
          {batchProgress.currentSentenceLabel
            ? ` • ${batchProgress.currentSentenceLabel}`
            : ""}
          {batchProgress.skipped > 0
            ? ` • ${batchProgress.skipped} skipped`
            : ""}
        </AdminInlineNotice>
      ) : null}

      <section className="tc-admin-frame rounded-[28px] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
              Topic setup
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Metadata first, then sentence work.
            </h2>
            <p className="tc-muted mt-3 text-sm leading-7">
              Keep the latest sentence text saved before you publish, generate, or finalize audio.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentTopic ? (
              <>
                <AdminToneBadge
                  tone={getTopicStatusTone(currentTopic.status)}
                  label={currentTopic.status}
                />
                <AdminToneBadge
                  tone={currentTopic.isReadyToPublish ? "live" : "warning"}
                  label={`${currentTopic.readySentenceCount}/${currentTopic.sentenceCount} ready`}
                />
                <AdminToneBadge
                  tone={getAccessTone(currentTopic.accessType)}
                  label={currentTopic.accessType}
                />
                <AdminVisibilityBadge visibility={currentTopic.visibility} />
              </>
            ) : (
              <AdminToneBadge tone="info" label="Unsaved draft" />
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminInput
            label="Topic title"
            value={formState.title}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
          <AdminInput
            label="Slug"
            hint="Leave blank to derive it from the title."
            value={formState.slug}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                slug: event.target.value,
              }))
            }
          />
          <AdminInput
            label="Order"
            value={formState.orderIndex}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                orderIndex: event.target.value,
              }))
            }
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <AdminSelect
              label="Access"
              value={formState.accessType}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  accessType: event.target.value as EnglishSpeakingTopicAccessType,
                }))
              }
            >
              {ACCESS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AdminSelect>
            <AdminSelect
              label="Visibility"
              value={formState.visibility}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  visibility: event.target.value as EnglishSpeakingTopicVisibility,
                }))
              }
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>

        <div className="mt-4">
          <AdminTextarea
            label="Short description"
            className="min-h-28"
            value={formState.description}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="tc-button-primary"
            disabled={isBusy}
            onClick={() => void saveTopicMutation.mutateAsync()}
          >
            {saveTopicMutation.isPending
              ? "Saving..."
              : isCreatingTopic
                ? "Create topic"
                : "Save changes"}
          </button>

          {currentTopic?.status === "PUBLISHED" ? (
            <button
              type="button"
              className="tc-button-secondary"
              disabled={topicActionDisabled}
              onClick={() => void unpublishTopicMutation.mutateAsync()}
            >
              {unpublishTopicMutation.isPending ? "Updating..." : "Move to draft"}
            </button>
          ) : (
            <button
              type="button"
              className="tc-button-secondary"
              disabled={topicActionDisabled}
              onClick={() => void publishTopicMutation.mutateAsync()}
            >
              {publishTopicMutation.isPending ? "Publishing..." : "Publish topic"}
            </button>
          )}

          <button
            type="button"
            className="tc-button-secondary"
            disabled={topicActionDisabled}
            onClick={() => void runTopicBatch("generate")}
          >
            {batchProgress?.action === "generate"
              ? `Generating ${batchProgress.completed}/${batchProgress.total}`
              : "Generate all previews"}
          </button>

          <button
            type="button"
            className="tc-button-secondary"
            disabled={topicActionDisabled}
            onClick={() => void runTopicBatch("finalize")}
          >
            {batchProgress?.action === "finalize"
              ? `Finalizing ${batchProgress.completed}/${batchProgress.total}`
              : "Finalize all"}
          </button>

          {currentTopic ? (
            <button
              type="button"
              className="tc-button-secondary"
              disabled={deleteTopicMutation.isPending}
              onClick={() => void handleDeleteTopic()}
            >
              {deleteTopicMutation.isPending ? "Deleting..." : "Delete topic"}
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <AdminInlineNotice
            tone={
              currentTopic?.isReadyToPublish && !hasUnsavedChanges
                ? "success"
                : "warning"
            }
          >
            {hasUnsavedChanges
              ? "Unsaved edits are present. Save the topic before you generate audio, finalize topic audio, or change publish state."
              : batchProgress
                ? `A one-by-one ${batchProgress.action === "generate" ? "preview generation" : "finalize"} batch is running. The counter updates after each sentence completes.`
              : currentTopic?.isReadyToPublish
                ? "Every sentence has current finalized Hindi, Marathi, and English audio. This topic is ready to publish."
                : "Some sentences still need preview or finalize work before this topic can be published."}
          </AdminInlineNotice>
          <AdminInlineNotice>
            {currentTopic
              ? `Last updated ${formatAdminDateTime(currentTopic.updatedAt)}. Created ${formatAdminDateTime(currentTopic.createdAt)}.`
              : "A blank draft opens first so you can add metadata calmly before working on the sentence deck."}
          </AdminInlineNotice>
        </div>
      </section>

      {pageMessage ? <AdminInlineNotice>{pageMessage}</AdminInlineNotice> : null}

      <section className="tc-admin-frame-subtle rounded-[28px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
              Sentence deck
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Expand one sentence at a time and keep the edit space focused.
            </h2>
          </div>
          <button
            type="button"
            className="tc-button-secondary"
            onClick={addSentence}
          >
            Add sentence
          </button>
        </div>

        {formState.sentences.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              eyebrow="Sentence deck"
              title="Add the first sentence to start the topic."
              description="Each sentence stores Hindi, Marathi, English, plus separate audio generation state."
            />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {formState.sentences.map((sentence, index) => {
              const persistedSentence =
                currentTopic?.sentences.find((item) => item.id === sentence.id) ?? null;
              const isExpanded = expandedSentenceKey === sentence.clientId;
              const currentReadyCount =
                persistedSentence?.audioStates.filter(
                  (state) => state.hasFinalized && state.isCurrent,
                ).length ?? 0;
              const previewReadyCount =
                persistedSentence?.audioStates.filter((state) => state.hasPreview).length ?? 0;
              const staleCount =
                persistedSentence?.audioStates.filter(
                  (state) => state.hasFinalized && !state.isCurrent,
                ).length ?? 0;

              return (
                <article
                  key={sentence.clientId}
                  className="rounded-[26px] border border-[rgba(0,30,64,0.08)] bg-white/88"
                >
                  <button
                    type="button"
                    className="flex w-full flex-wrap items-start justify-between gap-4 px-5 py-5 text-left"
                    onClick={() =>
                      setExpandedSentenceKey((current) =>
                        current === sentence.clientId ? null : sentence.clientId,
                      )
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AdminToneBadge
                          tone="info"
                          label={`Sentence ${String(index + 1).padStart(2, "0")}`}
                        />
                        <AdminToneBadge
                          tone={currentReadyCount === 3 ? "live" : "warning"}
                          label={`${currentReadyCount}/3 finalized`}
                        />
                        {previewReadyCount > 0 ? (
                          <AdminToneBadge
                            tone="info"
                            label={`${previewReadyCount} preview ready`}
                          />
                        ) : null}
                        {staleCount > 0 ? (
                          <AdminToneBadge
                            tone="warning"
                            label={`${staleCount} outdated`}
                          />
                        ) : null}
                      </div>
                      <TextContent
                        as="p"
                        className="mt-3 text-lg font-semibold text-[color:var(--brand)]"
                        value={sentence.englishText || "English sentence not entered yet."}
                      />
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        Order {sentence.orderIndex || "pending"} •{" "}
                        {persistedSentence ? `Saved id ${persistedSentence.id}` : "Unsaved sentence"}
                      </p>
                    </div>

                    <span className="tc-button-secondary">
                      {isExpanded ? "Hide details" : "Edit sentence"}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-[rgba(0,30,64,0.08)] px-5 py-5">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="tc-button-secondary"
                          disabled={hasUnsavedChanges || isBusy || !persistedSentence}
                          onClick={() =>
                            persistedSentence &&
                            void generateSentenceAudioMutation.mutateAsync(persistedSentence.id)
                          }
                        >
                          {generateSentenceAudioMutation.isPending
                            ? "Working..."
                            : "Generate preview"}
                        </button>
                        <button
                          type="button"
                          className="tc-button-secondary"
                          disabled={hasUnsavedChanges || isBusy || !persistedSentence}
                          onClick={() =>
                            persistedSentence &&
                            void finalizeSentenceAudioMutation.mutateAsync(persistedSentence.id)
                          }
                        >
                          {finalizeSentenceAudioMutation.isPending
                            ? "Working..."
                            : "Finalize sentence"}
                        </button>
                        <button
                          type="button"
                          className="tc-button-secondary"
                          onClick={() => removeSentence(sentence.clientId)}
                        >
                          Remove sentence
                        </button>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-[10rem_minmax(0,1fr)]">
                        <AdminInput
                          label="Order"
                          value={sentence.orderIndex}
                          onChange={(event) =>
                            updateSentence(sentence.clientId, {
                              orderIndex: event.target.value,
                            })
                          }
                        />
                        <div className="grid gap-4">
                          <AdminTextarea
                            label="Hindi"
                            className="min-h-28"
                            value={sentence.hindiText}
                            onChange={(event) =>
                              updateSentence(sentence.clientId, {
                                hindiText: event.target.value,
                              })
                            }
                          />
                          <AdminTextarea
                            label="Marathi"
                            className="min-h-28"
                            value={sentence.marathiText}
                            onChange={(event) =>
                              updateSentence(sentence.clientId, {
                                marathiText: event.target.value,
                              })
                            }
                          />
                          <AdminTextarea
                            label="English"
                            className="min-h-28"
                            value={sentence.englishText}
                            onChange={(event) =>
                              updateSentence(sentence.clientId, {
                                englishText: event.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 xl:grid-cols-3">
                        {ENGLISH_SPEAKING_LANGUAGE_ORDER.map((language) => {
                          const audioState = persistedSentence
                            ? getAudioStateForLanguage(persistedSentence, language)
                            : null;

                          return (
                            <div
                              key={`${sentence.clientId}-${language}`}
                              className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-[rgba(248,249,250,0.96)] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[color:var(--brand)]">
                                    {getEnglishSpeakingLanguageLabel(language)}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                                    {getAudioLabel(audioState)}
                                  </p>
                                </div>
                                <AdminToneBadge
                                  tone={getAudioTone(audioState)}
                                  label={audioState?.status ?? "NOT_GENERATED"}
                                />
                              </div>

                              <div className="mt-4 flex flex-wrap gap-3">
                                <AudioPreviewButton
                                  disabled={!audioState?.previewStreamPath}
                                  label="Play preview"
                                  path={audioState?.previewStreamPath ?? null}
                                />
                                <AudioPreviewButton
                                  disabled={!audioState?.finalizedStreamPath}
                                  label="Play final"
                                  path={audioState?.finalizedStreamPath ?? null}
                                />
                              </div>

                              {audioState?.lastError ? (
                                <p className="mt-3 text-xs leading-5 text-[#8b2026]">
                                  {audioState.lastError}
                                </p>
                              ) : null}

                              {audioState && !audioState.isCurrent && audioState.hasFinalized ? (
                                <p className="mt-3 text-xs leading-5 text-[color:var(--accent-public)]">
                                  The finalized file does not match the latest saved sentence text.
                                </p>
                              ) : null}

                              <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
                                Generated {formatAdminDateTime(audioState?.generatedAt)} • Finalized{" "}
                                {formatAdminDateTime(audioState?.finalizedAt)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <AdminDialogShell
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        title="Import topic JSON"
        description="Keep the editor clean by handling JSON input in a separate popup. Applying the import replaces the current sentence deck in the form until you save."
        actions={
          <>
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tc-button-primary"
              onClick={applyImportedTopicDraft}
            >
              Apply import
            </button>
          </>
        }
      >
        <div className="grid gap-4">
          <AdminInput
            label="Title override"
            hint="Optional. This is useful when the pasted JSON is a direct sentence array."
            value={importTitleOverride}
            onChange={(event) => setImportTitleOverride(event.target.value)}
          />
          <AdminTextarea
            label="Topic JSON"
            className="min-h-64"
            hint="Supports either the original object with document_title + data or a direct sentence array."
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
          />
          <AdminInlineNotice>
            Apply import updates only the form. Save the topic afterward if you want the imported sentence deck to become the live admin draft.
          </AdminInlineNotice>
        </div>
      </AdminDialogShell>
    </div>
  );
}
