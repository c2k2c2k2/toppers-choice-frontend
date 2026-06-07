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

type EnglishPlayerIcon =
  | "back"
  | "collapse"
  | "expand"
  | "headphones"
  | "locate"
  | "next"
  | "pause"
  | "play"
  | "previous"
  | "replay";

function EnglishPlayerGlyph({
  icon,
}: Readonly<{
  icon: EnglishPlayerIcon;
}>) {
  if (icon === "back") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path d="M19 12H5" />
        <path d="M12 5l-7 7 7 7" />
      </svg>
    );
  }

  if (icon === "headphones") {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M4 14a8 8 0 0 1 16 0" />
        <path d="M4 14v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2" />
        <path d="M20 14v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2" />
      </svg>
    );
  }

  if (icon === "collapse" || icon === "expand") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path d={icon === "collapse" ? "M6 9l6 6 6-6" : "M18 15l-6-6-6 6"} />
      </svg>
    );
  }

  if (icon === "locate") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path d="M12 3v3" />
        <path d="M12 18v3" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" />
      </svg>
    );
  }

  if (icon === "pause") {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M7 5h4v14H7z" />
        <path d="M13 5h4v14h-4z" />
      </svg>
    );
  }

  if (icon === "play") {
    return (
      <svg
        aria-hidden="true"
        className="h-5 w-5 translate-x-0.5"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8 5.5v13l11-6.5z" />
      </svg>
    );
  }

  if (icon === "replay") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
        viewBox="0 0 24 24"
      >
        <path d="M4 12a8 8 0 1 0 2.34-5.66" />
        <path d="M4 4v6h6" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        d={
          icon === "next"
            ? "M6 5.5 14.5 12 6 18.5v-13ZM16 5h2v14h-2V5Z"
            : "M18 5.5 9.5 12 18 18.5v-13ZM6 5h2v14H6V5Z"
        }
      />
    </svg>
  );
}

function IconButton({
  disabled = false,
  icon,
  label,
  onClick,
  tone = "secondary",
}: Readonly<{
  disabled?: boolean;
  icon: EnglishPlayerIcon;
  label: string;
  onClick: () => void;
  tone?: "primary" | "secondary";
}>) {
  const isPrimary = tone === "primary";

  return (
    <button
      type="button"
      aria-label={label}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-45",
        isPrimary
          ? "h-14 w-14 border-[rgba(103,56,0,0.18)] bg-[color:var(--cta-surface)] text-white shadow-[0_16px_32px_rgba(103,56,0,0.24)] hover:-translate-y-0.5"
          : "h-11 w-11 border-[rgba(0,30,64,0.1)] bg-white/82 text-[color:var(--brand)] hover:border-[rgba(0,51,102,0.18)] hover:bg-white",
      ].join(" ")}
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <EnglishPlayerGlyph icon={icon} />
      <span className="sr-only">{label}</span>
    </button>
  );
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
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(true);
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

  useEffect(() => {
    if (!currentSentenceId || !currentTrack) {
      return;
    }

    const timeout = window.setTimeout(() => {
      sentenceElementRefs.current[currentSentenceId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [currentSentenceId, currentTrack]);

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
    <div
      className={[
        "flex flex-col gap-4",
        isPlayerMinimized ? "pb-[6.75rem] lg:pb-24" : "pb-[11.5rem] lg:pb-32",
      ].join(" ")}
    >
      <section className="tc-student-panel rounded-[22px] p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {ENGLISH_SPEAKING_LANGUAGE_ORDER.map((language) => {
              const isActive = selectedLanguages.includes(language);

              return (
                <button
                  key={language}
                  type="button"
                  aria-label={`Toggle ${getEnglishSpeakingLanguageLabel(language)}`}
                  className={[
                    "inline-flex h-11 min-w-11 items-center justify-center rounded-full border px-3 text-sm font-bold transition",
                    isActive
                      ? "border-[rgba(0,51,102,0.18)] bg-[rgba(0,51,102,0.1)] text-[color:var(--brand)]"
                      : "border-[rgba(0,30,64,0.08)] bg-white/76 text-[color:var(--muted)]",
                  ].join(" ")}
                  onClick={() => toggleLanguage(language)}
                  title={getEnglishSpeakingLanguageLabel(language)}
                >
                  {getEnglishSpeakingLanguageLabel(language)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(103,56,0,0.18)] bg-[color:var(--cta-surface)] px-4 text-sm font-bold text-white shadow-[0_14px_26px_rgba(103,56,0,0.2)] transition hover:-translate-y-0.5"
              onClick={queueEntireTopic}
            >
              <EnglishPlayerGlyph icon={queue.length > 0 ? "replay" : "play"} />
              {queue.length > 0 ? "Restart" : "Start"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(0,30,64,0.1)] bg-white/84 px-4 text-sm font-bold text-[color:var(--brand)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!currentTrack}
              onClick={jumpToCurrentSentence}
            >
              <EnglishPlayerGlyph icon="locate" />
              Current
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="tc-overline" style={{ color: "var(--accent-student)" }}>
            Playlist
          </p>
          {currentTrack ? (
            <span className="tc-student-chip" data-tone="accent">
              {currentIndex + 1}/{queue.length}
            </span>
          ) : null}
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
                "tc-student-card rounded-[20px] p-4",
                isCurrentSentence
                  ? "border-[rgba(0,51,102,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(242,247,252,0.98)_100%)] ring-1 ring-[rgba(0,51,102,0.12)] shadow-[0_18px_40px_rgba(0,30,64,0.1)]"
                  : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="tc-overline">
                      {String(sentence.orderIndex).padStart(2, "0")}
                    </p>
                    {isCurrentSentence ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,51,102,0.12)] bg-[rgba(0,51,102,0.08)] px-3 py-1 text-[0.72rem] font-semibold text-[color:var(--brand)]">
                        <span className="h-2 w-2 rounded-full bg-[color:var(--accent-student)] animate-pulse" />
                        {isLoadingTrack ? "Loading" : isPlaying ? "Live" : "Paused"}
                      </span>
                    ) : null}
                  </div>
                  <TextContent
                    as="p"
                    className="mt-2 text-base font-semibold leading-6 text-[color:var(--brand)] sm:text-lg"
                    value={sentence.englishText}
                  />
                </div>

                <button
                  type="button"
                  aria-label={isCurrentSentence ? "Replay sentence" : "Play sentence"}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0,30,64,0.1)] bg-white/86 text-[color:var(--brand)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!canPlaySentence || (isCurrentSentence && isLoadingTrack)}
                  onClick={() => queueSingleSentence(sentence)}
                  title={isCurrentSentence ? "Replay sentence" : "Play sentence"}
                >
                  <EnglishPlayerGlyph icon={isCurrentSentence ? "replay" : "play"} />
                </button>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {ENGLISH_SPEAKING_LANGUAGE_ORDER.map((language) => {
                  const isLanguageInMix = selectedLanguages.includes(language);
                  const isCurrentLanguage =
                    isCurrentSentence && currentTrack?.language === language;
                  const sentenceValue = getSentenceTextForLanguage(sentence, language);

                  return (
                    <div
                      key={language}
                      className={[
                        "rounded-[16px] border px-3 py-2 transition-all",
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
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/72 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent-student)] animate-pulse" />
                            Live
                          </span>
                        ) : null}
                      </div>
                      <TextContent
                        as="p"
                        className="mt-2 text-sm leading-5 text-[color:var(--brand)]"
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

      <div className="pointer-events-none fixed bottom-[4.1rem] left-0 right-0 z-[55] md:bottom-5 md:left-4 md:right-4 lg:bottom-4 xl:left-[18rem] xl:right-0 2xl:left-[19rem]">
        <section className="pointer-events-auto rounded-t-[24px] border border-[rgba(0,30,64,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(246,250,253,0.99)_100%)] shadow-[0_24px_54px_rgba(0,30,64,0.16)] backdrop-blur-xl md:rounded-[24px]">
          {isPlayerMinimized ? (
            <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-[color:var(--brand)] text-white shadow-[0_12px_24px_rgba(0,30,64,0.18)]">
                <EnglishPlayerGlyph icon="headphones" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[color:var(--brand)]">
                  {currentTrack ? currentTrack.sentenceText : topicTitle}
                </p>
                <p className="truncate text-xs font-semibold text-[color:var(--muted)]">
                  {currentTrack
                    ? `${currentTrack.sentenceLabel} · ${getEnglishSpeakingLanguageLabel(currentTrack.language)}`
                    : "Ready"}
                </p>
              </div>
              <IconButton
                disabled={isLoadingTrack || availableSentenceCount === 0}
                icon={isPlaying ? "pause" : "play"}
                label={!currentTrack ? "Play topic" : isPlaying ? "Pause" : "Play"}
                onClick={() => void togglePlayback()}
                tone="primary"
              />
              <button
                type="button"
                aria-label="Expand player"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(0,30,64,0.1)] bg-white/84 text-[color:var(--brand)] transition hover:bg-white"
                onClick={() => setIsPlayerMinimized(false)}
                title="Expand player"
              >
                <EnglishPlayerGlyph icon="expand" />
              </button>
            </div>
          ) : (
          <div className="grid gap-2 p-3 sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[color:var(--brand)] text-white shadow-[0_14px_28px_rgba(0,30,64,0.2)]">
                  <EnglishPlayerGlyph icon="headphones" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[color:var(--brand)] sm:text-base">
                    {currentTrack
                      ? currentTrack.sentenceText
                      : topicTitle}
                  </p>
                  <p className="truncate text-xs font-semibold text-[color:var(--muted)]">
                    {currentTrack
                      ? `${currentTrack.sentenceLabel} · ${getEnglishSpeakingLanguageLabel(currentTrack.language)}`
                      : selectedLanguages
                          .map((language) => getEnglishSpeakingLanguageLabel(language))
                          .join(" · ")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 lg:justify-end">
                <IconButton
                  disabled={!currentTrack}
                  icon="previous"
                  label="Previous track"
                  onClick={playPreviousTrack}
                />
                <IconButton
                  disabled={isLoadingTrack || availableSentenceCount === 0}
                  icon={isPlaying ? "pause" : "play"}
                  label={
                    !currentTrack
                      ? "Play topic"
                      : isPlaying
                        ? "Pause"
                        : "Play"
                  }
                  onClick={() => void togglePlayback()}
                  tone="primary"
                />
                <IconButton
                  disabled={!currentTrack || currentIndex >= queue.length - 1}
                  icon="next"
                  label="Next track"
                  onClick={playNextTrack}
                />
                <IconButton
                  disabled={!currentTrack}
                  icon="locate"
                  label="Jump to current sentence"
                  onClick={jumpToCurrentSentence}
                />
                <button
                  type="button"
                  aria-label="Minimize player"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(0,30,64,0.1)] bg-white/84 text-[color:var(--brand)] transition hover:bg-white"
                  onClick={() => setIsPlayerMinimized(true)}
                  title="Minimize player"
                >
                  <EnglishPlayerGlyph icon="collapse" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-10 text-xs font-semibold text-[color:var(--muted)]">
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
              <span className="w-10 text-right text-xs font-semibold text-[color:var(--muted)]">
                {formatAudioTime(duration)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold text-[color:var(--muted)]">
                {isLoadingTrack
                  ? "Loading"
                  : nextTrack
                    ? `Next: ${nextTrack.sentenceLabel} · ${getEnglishSpeakingLanguageLabel(nextTrack.language)}`
                    : currentTrack
                      ? "Queue end"
                      : "Ready"}
              </p>
              {playbackError ? (
                <p className="text-xs leading-5 text-[#8b2026]">{playbackError}</p>
              ) : null}
            </div>
          </div>
          )}

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
    <div className="flex flex-col gap-4">
      <section className="tc-student-panel rounded-[22px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="tc-overline" style={{ color: "var(--accent-student)" }}>
              English speaking
            </p>
            <TextContent
              as="h1"
              className="mt-2 truncate text-2xl font-semibold text-[color:var(--brand)] md:text-3xl"
              value={topic.title}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="tc-student-chip">{topic.sentenceCount} sentences</span>
              <span className="tc-student-chip" data-tone="soft">
                {topic.accessType}
              </span>
            </div>
          </div>

          <Link
            href="/student/english-speaking"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(0,30,64,0.1)] bg-white/84 px-4 text-sm font-bold text-[color:var(--brand)] transition hover:bg-white"
          >
            <EnglishPlayerGlyph icon="back" />
            Topics
          </Link>
        </div>
      </section>

      <StudentEnglishSpeakingPlayer
        sentences={topic.sentences}
        topicTitle={topic.title}
      />
    </div>
  );
}
