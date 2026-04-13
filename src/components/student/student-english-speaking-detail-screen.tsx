"use client";

import { useEffect, useEffectEvent, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  ENGLISH_SPEAKING_LANGUAGE_ORDER,
  fetchEnglishSpeakingAudioBlob,
  getEnglishSpeakingLanguageLabel,
  getStudentEnglishSpeakingTopic,
  type EnglishSpeakingLanguage,
  type StudentEnglishSpeakingSentence,
} from "@/lib/english-speaking";
import { TextContent } from "@/components/primitives/text-content";
import { EmptyState } from "@/components/primitives/empty-state";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { PremiumAccessCard } from "@/components/payments/premium-access-card";

type QueueTrack = {
  key: string;
  language: EnglishSpeakingLanguage;
  referenceText: string;
  sentenceId: string;
  sentenceLabel: string;
  sentenceText: string;
  streamPath: string;
};

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getSentenceTextForLanguage(
  sentence: StudentEnglishSpeakingSentence,
  language: EnglishSpeakingLanguage,
) {
  switch (language) {
    case "HINDI":
      return sentence.hindiText;
    case "MARATHI":
      return sentence.marathiText;
    case "ENGLISH":
      return sentence.englishText;
  }
}

function isInterruptedPlaybackError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    error.name === "AbortError" ||
    message.includes("the play() request was interrupted") ||
    message.includes("interrupted by a new load request")
  );
}

function buildSentenceQueue(
  sentence: StudentEnglishSpeakingSentence,
  selectedLanguages: EnglishSpeakingLanguage[],
) {
  const languageRank = new Map(
    ENGLISH_SPEAKING_LANGUAGE_ORDER.map((language, index) => [language, index]),
  );

  return sentence.audioTracks
    .filter((track) => selectedLanguages.includes(track.language))
    .sort(
      (left, right) =>
        (languageRank.get(left.language) ?? 0) -
        (languageRank.get(right.language) ?? 0),
    )
    .map<QueueTrack>((track) => ({
      key: `${sentence.id}-${track.language}`,
      language: track.language,
      referenceText: sentence.englishText,
      sentenceId: sentence.id,
      sentenceLabel: `Sentence ${String(sentence.orderIndex).padStart(2, "0")}`,
      sentenceText: getSentenceTextForLanguage(sentence, track.language),
      streamPath: track.streamPath,
    }));
}

function StudentEnglishSpeakingPlayer({
  sentences,
  topicTitle,
}: Readonly<{
  sentences: StudentEnglishSpeakingSentence[];
  topicTitle: string;
}>) {
  const authSession = useAuthSession();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const playbackRequestIdRef = useRef(0);
  const sentenceElementRefs = useRef<Record<string, HTMLElement | null>>({});
  const [selectedLanguages, setSelectedLanguages] = useState<EnglishSpeakingLanguage[]>(
    ENGLISH_SPEAKING_LANGUAGE_ORDER,
  );
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] ?? null : null;
  const nextTrack =
    currentIndex >= 0 && currentIndex < queue.length - 1
      ? queue[currentIndex + 1] ?? null
      : null;
  const currentSentenceId = currentTrack?.sentenceId ?? null;
  const availableSentenceCount = sentences.filter((sentence) =>
    sentence.audioTracks.some((track) => selectedLanguages.includes(track.language)),
  ).length;

  const loadTrack = useEffectEvent(async (track: QueueTrack) => {
    const accessToken = await authSession.ensureAccessToken();
    if (!accessToken) {
      throw new Error("A signed-in session is required for topic playback.");
    }

    const blob = await fetchEnglishSpeakingAudioBlob(track.streamPath, accessToken);
    return URL.createObjectURL(blob);
  });

  useEffect(() => {
    const audioElement = audioRef.current;

    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.removeAttribute("src");
        audioElement.load();
      }

      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentTrack) {
      return;
    }

    setIsLoadingTrack(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    const requestId = playbackRequestIdRef.current + 1;
    let isCancelled = false;

    playbackRequestIdRef.current = requestId;
    setIsLoadingTrack(true);
    setIsPlaying(false);
    setPlaybackError(null);
    setCurrentTime(0);
    setDuration(0);
    audioRef.current?.pause();

    void (async () => {
      let nextUrl: string | null = null;

      try {
        nextUrl = await loadTrack(currentTrack);

        if (isCancelled || playbackRequestIdRef.current !== requestId) {
          URL.revokeObjectURL(nextUrl);
          return;
        }

        const audioElement = audioRef.current;

        if (!audioElement) {
          URL.revokeObjectURL(nextUrl);
          return;
        }

        audioElement.pause();
        audioElement.removeAttribute("src");
        audioElement.load();

        if (activeAudioUrlRef.current) {
          URL.revokeObjectURL(activeAudioUrlRef.current);
        }

        activeAudioUrlRef.current = nextUrl;
        audioElement.src = nextUrl;
        audioElement.currentTime = 0;
        await audioElement.play();
      } catch (error) {
        if (nextUrl && activeAudioUrlRef.current !== nextUrl) {
          URL.revokeObjectURL(nextUrl);
        }

        if (
          !isCancelled &&
          playbackRequestIdRef.current === requestId &&
          !isInterruptedPlaybackError(error)
        ) {
          setPlaybackError(
            error instanceof Error
              ? error.message
              : "The selected audio track could not be played.",
          );
        }
      } finally {
        if (!isCancelled && playbackRequestIdRef.current === requestId) {
          setIsLoadingTrack(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [authSession.sessionId, currentTrack]);

  function queueEntireTopic() {
    const nextQueue = sentences.flatMap((sentence) =>
      buildSentenceQueue(sentence, selectedLanguages),
    );

    if (nextQueue.length === 0) {
      setPlaybackError("No audio tracks are available for the selected language mix.");
      return;
    }

    setPlaybackError(null);
    setQueue(nextQueue);
    setCurrentIndex(0);
  }

  function queueSingleSentence(sentence: StudentEnglishSpeakingSentence) {
    const nextQueue = buildSentenceQueue(sentence, selectedLanguages);

    if (nextQueue.length === 0) {
      setPlaybackError("This sentence does not have audio for the selected languages.");
      return;
    }

    setPlaybackError(null);
    setQueue(nextQueue);
    setCurrentIndex(0);
  }

  function toggleLanguage(language: EnglishSpeakingLanguage) {
    setSelectedLanguages((current) => {
      if (current.includes(language)) {
        const next = current.filter((item) => item !== language);
        return next.length > 0 ? next : current;
      }

      return ENGLISH_SPEAKING_LANGUAGE_ORDER.filter(
        (item) => item === language || current.includes(item),
      );
    });
  }

  function handleEnded() {
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }

    setIsPlaying(false);
    setCurrentTime(0);
  }

  async function togglePlayback() {
    if (isLoadingTrack) {
      return;
    }

    if (!audioRef.current || !currentTrack) {
      queueEntireTopic();
      return;
    }

    setPlaybackError(null);

    if (audioRef.current.paused) {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }

      try {
        await audioRef.current.play();
      } catch (error) {
        if (!isInterruptedPlaybackError(error)) {
          setPlaybackError(
            error instanceof Error
              ? error.message
              : "The selected audio track could not be played.",
          );
        }
      }
      return;
    }

    audioRef.current.pause();
  }

  function playPreviousTrack() {
    if (!currentTrack || !audioRef.current) {
      return;
    }

    if (audioRef.current.currentTime > 3 || currentIndex <= 0) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    setCurrentIndex(currentIndex - 1);
  }

  function playNextTrack() {
    if (!currentTrack || currentIndex >= queue.length - 1) {
      return;
    }

    setCurrentIndex(currentIndex + 1);
  }

  function jumpToCurrentSentence() {
    if (!currentSentenceId) {
      return;
    }

    sentenceElementRefs.current[currentSentenceId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function handleSeek(event: ChangeEvent<HTMLInputElement>) {
    const nextTime = Number(event.target.value);

    if (!audioRef.current || !Number.isFinite(nextTime)) {
      return;
    }

    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <div className="flex flex-col gap-6 pb-[15rem] lg:pb-44">
      <section className="tc-student-panel rounded-[28px] p-6">
        <div className="tc-student-section-header">
          <div className="tc-student-section-header-copy">
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Practice setup
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              One calm column, one pinned player.
            </h2>
            <p className="tc-muted mt-3 text-sm leading-7">
              Pick the language mix once, then move through the sentence deck while the player stays visible and the active track stays highlighted.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="tc-student-chip">
              {availableSentenceCount} sentence{availableSentenceCount === 1 ? "" : "s"} ready
            </span>
            <span className="tc-student-chip" data-tone="soft">
              {selectedLanguages.map((language) => getEnglishSpeakingLanguageLabel(language)).join(" · ")}
            </span>
            {currentTrack ? (
              <span className="tc-student-chip" data-tone="accent">
                Track {currentIndex + 1}/{queue.length}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {ENGLISH_SPEAKING_LANGUAGE_ORDER.map((language) => (
            <button
              key={language}
              type="button"
              className="tc-filter-chip"
              data-active={selectedLanguages.includes(language)}
              onClick={() => toggleLanguage(language)}
            >
              {getEnglishSpeakingLanguageLabel(language)}
            </button>
          ))}
        </div>

        <p className="tc-muted mt-4 text-sm leading-6">
          The selected language mix is used the next time you start a topic or sentence queue from the player or from a sentence card.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="tc-student-section-header">
          <div className="tc-student-section-header-copy">
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Sentence playlist
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Follow the active sentence while you listen.
            </h2>
            <p className="tc-muted mt-3 text-sm leading-7">
              Every card stays in one stream, and the current sentence plus the current language tile are highlighted in real time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="tc-button-primary"
              onClick={queueEntireTopic}
            >
              {queue.length > 0 ? "Restart topic queue" : "Start topic queue"}
            </button>
            <button
              type="button"
              className="tc-button-secondary"
              disabled={!currentTrack}
              onClick={jumpToCurrentSentence}
            >
              Jump to current
            </button>
          </div>
        </div>

        {sentences.map((sentence) => {
          const canPlaySentence = sentence.audioTracks.some((track) =>
            selectedLanguages.includes(track.language),
          );
          const isCurrentSentence = sentence.id === currentSentenceId;

          return (
            <article
              key={sentence.id}
              ref={(element) => {
                sentenceElementRefs.current[sentence.id] = element;
              }}
              className={[
                "tc-student-card rounded-[26px] p-5",
                isCurrentSentence
                  ? "border-[rgba(0,51,102,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(242,247,252,0.98)_100%)] ring-1 ring-[rgba(0,51,102,0.12)] shadow-[0_18px_40px_rgba(0,30,64,0.1)]"
                  : "",
              ].join(" ")}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="tc-overline">
                      Sentence {String(sentence.orderIndex).padStart(2, "0")}
                    </p>
                    {isCurrentSentence ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,51,102,0.12)] bg-[rgba(0,51,102,0.08)] px-3 py-1 text-[0.72rem] font-semibold text-[color:var(--brand)]">
                        <span className="h-2 w-2 rounded-full bg-[color:var(--accent-student)] animate-pulse" />
                        {isLoadingTrack ? "Loading" : isPlaying ? "Now playing" : "Ready in player"}
                      </span>
                    ) : null}
                  </div>
                  <TextContent
                    as="p"
                    className="mt-2 text-lg font-semibold text-[color:var(--brand)]"
                    value={sentence.englishText}
                  />
                </div>

                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!canPlaySentence || (isCurrentSentence && isLoadingTrack)}
                  onClick={() => queueSingleSentence(sentence)}
                >
                  {isCurrentSentence && isLoadingTrack
                    ? "Loading..."
                    : isCurrentSentence
                      ? "Replay sentence"
                      : "Play sentence"}
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {ENGLISH_SPEAKING_LANGUAGE_ORDER.map((language) => {
                  const isLanguageInMix = selectedLanguages.includes(language);
                  const isCurrentLanguage =
                    isCurrentSentence && currentTrack?.language === language;
                  const sentenceValue = getSentenceTextForLanguage(sentence, language);

                  return (
                    <div
                      key={language}
                      className={[
                        "rounded-[20px] border px-4 py-3 transition-all",
                        isCurrentLanguage
                          ? "border-[rgba(0,51,102,0.16)] bg-[rgba(0,51,102,0.08)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.36)]"
                          : isLanguageInMix
                            ? "border-[rgba(0,30,64,0.08)] bg-[rgba(0,30,64,0.04)]"
                            : "border-transparent bg-[rgba(243,247,250,0.72)] opacity-70",
                      ].join(" ")}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="tc-overline">
                          {getEnglishSpeakingLanguageLabel(language)}
                        </p>
                        {isCurrentLanguage ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-student)] animate-pulse" />
                            Live
                          </span>
                        ) : null}
                      </div>
                      <TextContent
                        as="p"
                        className="mt-2 text-sm leading-6 text-[color:var(--brand)]"
                        value={sentenceValue}
                      />
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>

      <div className="pointer-events-none fixed bottom-24 left-3 right-3 z-30 md:left-4 md:right-4 lg:bottom-4 xl:left-[20.5rem] xl:right-5 2xl:left-[21.5rem]">
        <section className="pointer-events-auto rounded-[28px] border border-[rgba(0,30,64,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,250,253,0.98)_100%)] shadow-[0_24px_54px_rgba(0,30,64,0.16)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="tc-overline">Pinned player</p>
                  {currentTrack ? (
                    <span className="inline-flex items-center rounded-full border border-[rgba(0,51,102,0.12)] bg-[rgba(0,51,102,0.08)] px-3 py-1 text-[0.72rem] font-semibold text-[color:var(--brand)]">
                      Track {currentIndex + 1} of {queue.length}
                    </span>
                  ) : null}
                  {isLoadingTrack ? (
                    <span className="inline-flex items-center rounded-full border border-[rgba(225,134,0,0.14)] bg-[rgba(255,244,231,0.96)] px-3 py-1 text-[0.72rem] font-semibold text-[color:var(--cta-surface)]">
                      Loading next track
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-lg font-semibold text-[color:var(--brand)] md:text-xl">
                  {currentTrack
                    ? `${currentTrack.sentenceLabel} · ${getEnglishSpeakingLanguageLabel(currentTrack.language)}`
                    : topicTitle}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--brand)]">
                  {currentTrack
                    ? currentTrack.sentenceText
                    : `Choose a sentence or start the full topic queue with ${availableSentenceCount} playable sentence${availableSentenceCount === 1 ? "" : "s"}.`}
                </p>
                <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                  {currentTrack
                    ? currentTrack.referenceText !== currentTrack.sentenceText
                      ? currentTrack.referenceText
                      : selectedLanguages
                          .map((language) => getEnglishSpeakingLanguageLabel(language))
                          .join(" · ")
                    : selectedLanguages
                        .map((language) => getEnglishSpeakingLanguageLabel(language))
                        .join(" · ")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!currentTrack}
                  onClick={playPreviousTrack}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="tc-button-primary"
                  disabled={isLoadingTrack || availableSentenceCount === 0}
                  onClick={() => void togglePlayback()}
                >
                  {!currentTrack
                    ? "Play topic"
                    : isLoadingTrack
                      ? "Loading..."
                      : isPlaying
                        ? "Pause"
                        : "Play"}
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!currentTrack || currentIndex >= queue.length - 1}
                  onClick={playNextTrack}
                >
                  Next
                </button>
                <button
                  type="button"
                  className="tc-button-secondary"
                  disabled={!currentTrack}
                  onClick={jumpToCurrentSentence}
                >
                  Jump to current
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-12 text-xs font-semibold text-[color:var(--muted)]">
                {formatAudioTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                step="0.1"
                value={duration > 0 ? Math.min(currentTime, duration) : 0}
                disabled={!currentTrack || isLoadingTrack || duration <= 0}
                aria-label="Seek within the current audio track"
                className="h-2 w-full cursor-pointer rounded-full"
                style={{ accentColor: "var(--accent-student)" }}
                onChange={handleSeek}
              />
              <span className="w-12 text-right text-xs font-semibold text-[color:var(--muted)]">
                {formatAudioTime(duration)}
              </span>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-xs leading-5 text-[color:var(--muted)]">
                {nextTrack
                  ? `Up next: ${nextTrack.sentenceLabel} · ${getEnglishSpeakingLanguageLabel(nextTrack.language)}`
                  : currentTrack
                    ? "This is the last track in the current queue."
                    : "Start the topic queue or use any sentence card to begin listening."}
              </p>
              {playbackError ? (
                <p className="text-xs leading-5 text-[#8b2026]">{playbackError}</p>
              ) : null}
            </div>
          </div>

          <audio
            ref={audioRef}
            className="hidden"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={() => {
              if (!audioRef.current) {
                return;
              }

              setCurrentTime(audioRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (!audioRef.current) {
                return;
              }

              setDuration(
                Number.isFinite(audioRef.current.duration)
                  ? audioRef.current.duration
                  : 0,
              );
            }}
            onEnded={handleEnded}
          />
        </section>
      </div>
    </div>
  );
}

export function StudentEnglishSpeakingDetailScreen({
  slug,
}: Readonly<{
  slug: string;
}>) {
  const topicQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getStudentEnglishSpeakingTopic(slug, accessToken),
    queryKey: queryKeys.student.englishSpeakingDetail(slug),
    staleTime: 30_000,
  });

  if (topicQuery.isError) {
    return (
      <ErrorState
        title="This English speaking topic could not load."
        description="The student app could not fetch the topic detail and audio queue."
        onRetry={() => void topicQuery.refetch()}
      />
    );
  }

  if (topicQuery.isLoading || !topicQuery.data) {
    return (
      <LoadingState
        title="Preparing topic"
        description="Loading the sentence deck, access state, and audio playlist."
      />
    );
  }

  const topic = topicQuery.data;

  if (topic.accessMode === "LOCKED") {
    return (
      <PremiumAccessCard
        badgeLabel="Premium topic"
        description="This topic is published, but its sentence audio is available only inside the premium content tier."
        hints={[
          `${topic.sentenceCount} sentence drills are ready in this topic.`,
          "Once access is active, the full playlist opens automatically on this route.",
        ]}
        intent="content"
        returnTo={`/student/english-speaking/${encodeURIComponent(topic.slug)}`}
        source={`english-speaking:${topic.slug}`}
        title={topic.title}
      />
    );
  }

  if (topic.sentences.length === 0) {
    return (
      <EmptyState
        eyebrow="English speaking"
        title="This topic has not been finalized for playback yet."
        description="The topic exists, but the admin has not published the sentence deck with current audio yet."
        ctaHref="/student/english-speaking"
        ctaLabel="Back to topics"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-student-hero rounded-[32px] p-6 md:p-7">
        <div className="flex flex-col gap-6">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              English speaking topic
            </p>
            <TextContent
              as="h1"
              className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl"
              value={topic.title}
            />
            <TextContent
              as="p"
              className="tc-muted mt-4 max-w-3xl text-base leading-7"
              value={
                topic.description ??
                "Listen to each sentence in the default Hindi → Marathi → English order, then switch the language mix when you want a tighter drill."
              }
            />

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="tc-stat-chip">{topic.sentenceCount} sentences</span>
              <span className="tc-stat-chip">{topic.accessType}</span>
              <Link href="/student/english-speaking" className="tc-button-secondary">
                Back to topics
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Playback order</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Hindi, Marathi, then English
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                The queue keeps the sentence order steady across the full topic.
              </p>
            </div>
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Track current</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Active sentence stays highlighted
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                The live card and the active language tile both update while the playlist moves.
              </p>
            </div>
            <div className="tc-student-metric rounded-[24px] p-5">
              <p className="tc-overline">Pinned player</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Controls stay visible while you scroll
              </p>
              <p className="mt-2 text-sm leading-6 text-white/74">
                Keep listening, skip ahead, or jump back to the current sentence without losing your place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <StudentEnglishSpeakingPlayer
        sentences={topic.sentences}
        topicTitle={topic.title}
      />
    </div>
  );
}
