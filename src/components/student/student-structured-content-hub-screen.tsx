"use client";

import Link from "next/link";
import { useEffect } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery } from "@/lib/auth";
import {
  filterContentByContext,
  getContentFamilyDefinition,
  getContentFamilyDefinitions,
  getContentExcerpt,
  getStudentContent,
} from "@/lib/content";
import {
  buildStudentCatalogSnapshot,
  getMediumLabel,
  getStudentCatalog,
  getTrackLabel,
} from "@/lib/student";
import { ErrorState } from "@/components/primitives/error-state";
import { LoadingState } from "@/components/primitives/loading-state";
import { useStudentShellStore } from "@/stores";

function FamilyDiscoveryCard({
  count,
  family,
  firstTitle,
}: Readonly<{
  count: number;
  family: Parameters<typeof getContentFamilyDefinition>[0];
  firstTitle: string | null;
}>) {
  const definition = getContentFamilyDefinition(family);

  return (
    <Link
      href={definition.collectionHref}
      className="tc-card rounded-[24px] p-5 transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tc-kicker" style={{ color: definition.accentCssVar }}>
            {definition.eyebrow}
          </p>
          <h3 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
            {definition.label}
          </h3>
        </div>
        <span className="tc-code-chip">{count} items</span>
      </div>

      <p className="tc-muted mt-3 text-sm leading-6">
        {definition.discoveryDescription}
      </p>

      <div className="mt-4 rounded-[20px] bg-[rgba(0,30,64,0.04)] px-4 py-3">
        <p className="tc-overline">Current lead</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--brand)]">
          {firstTitle ?? "Published items will appear here as soon as this family goes live."}
        </p>
      </div>
    </Link>
  );
}

export function StudentStructuredContentHubScreen() {
  const {
    activeExamTrackCode,
    activeMediumCode,
    setActiveExamTrackCode,
    setActiveMediumCode,
  } = useStudentShellStore();
  const catalogQuery = useAuthenticatedQuery({
    queryFn: getStudentCatalog,
    queryKey: queryKeys.student.catalog(),
    staleTime: 60_000,
  });
  const contentQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => getStudentContent(accessToken),
    queryKey: queryKeys.student.contentList({}),
    staleTime: 30_000,
  });

  const catalog = catalogQuery.data;
  const snapshot = catalog
    ? buildStudentCatalogSnapshot(catalog, {
        examTrackCode: activeExamTrackCode,
        mediumCode: activeMediumCode,
      })
    : null;

  useEffect(() => {
    if (snapshot?.selectedTrack?.code && !activeExamTrackCode) {
      setActiveExamTrackCode(snapshot.selectedTrack.code);
    }
  }, [activeExamTrackCode, setActiveExamTrackCode, snapshot?.selectedTrack?.code]);

  useEffect(() => {
    if (snapshot?.selectedMedium?.code && !activeMediumCode) {
      setActiveMediumCode(snapshot.selectedMedium.code);
    }
  }, [activeMediumCode, setActiveMediumCode, snapshot?.selectedMedium?.code]);

  if (catalogQuery.isError || contentQuery.isError) {
    return (
      <ErrorState
        title="The structured learning hub could not load."
        description="We couldn't finish loading the catalog context and structured content families for the student surface."
        onRetry={() => {
          void catalogQuery.refetch();
          void contentQuery.refetch();
        }}
      />
    );
  }

  if (
    catalogQuery.isLoading ||
    contentQuery.isLoading ||
    !catalog ||
    !snapshot ||
    !contentQuery.data
  ) {
    return (
      <LoadingState
        title="Preparing the structured learning hub"
        description="Loading guidance, English-speaking, and current-affairs families with the current track and medium context."
      />
    );
  }

  const visibleItems = filterContentByContext(contentQuery.data.items, {
    examTrackId: snapshot.selectedTrack?.id ?? null,
    mediumId: snapshot.selectedMedium?.id ?? null,
  });
  const groupedItems = new Map<
    Parameters<typeof getContentFamilyDefinition>[0],
    typeof visibleItems
  >();

  for (const definition of getContentFamilyDefinitions()) {
    groupedItems.set(
      definition.family,
      visibleItems.filter((item) => item.family === definition.family),
    );
  }

  const guidanceFamilies = getContentFamilyDefinitions().filter((definition) =>
    ["CAREER_GUIDANCE", "INTERVIEW_GUIDANCE"].includes(definition.family),
  );
  const otherFamilies = getContentFamilyDefinitions().filter(
    (definition) =>
      !["CAREER_GUIDANCE", "INTERVIEW_GUIDANCE"].includes(definition.family),
  );
  const featuredItems = visibleItems.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-glow)" }}>
              Structured learning hub
            </p>
            <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Open the guidance and lesson modules that don&apos;t belong in the note reader.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              Career direction, interview readiness, spoken-English lessons,
              current affairs, and monthly updates now live in one reusable
              student content surface.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="tc-stat-chip">
                Track: {getTrackLabel(snapshot.selectedTrack)}
              </span>
              <span className="tc-stat-chip">
                Medium: {getMediumLabel(snapshot.selectedMedium)}
              </span>
              <span className="tc-stat-chip">{visibleItems.length} published items</span>
            </div>
          </div>

          <div className="grid gap-4">
            {featuredItems.length > 0 ? (
              featuredItems.map((item) => {
                const definition = getContentFamilyDefinition(item.family);

                return (
                  <Link
                    key={item.id}
                    href={definition.detailHref(item.slug)}
                    className="tc-glass rounded-[24px] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="tc-overline">{definition.shortLabel}</p>
                      <span className="tc-code-chip">{item.access.mode}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/74">
                      {getContentExcerpt(item)}
                    </p>
                  </Link>
                );
              })
            ) : (
              <div className="tc-glass rounded-[24px] p-5">
                <p className="tc-overline">Publishing status</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Structured content will appear here as soon as the first items are published.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tc-panel rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
              Guidance modules
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              Career direction and interview readiness
            </h2>
          </div>
          <span className="tc-code-chip">
            {guidanceFamilies.reduce(
              (total, definition) =>
                total + (groupedItems.get(definition.family)?.length ?? 0),
              0,
            )}{" "}
            items
          </span>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {guidanceFamilies.map((definition) => {
            const items = groupedItems.get(definition.family) ?? [];

            return (
              <FamilyDiscoveryCard
                key={definition.family}
                count={items.length}
                family={definition.family}
                firstTitle={items[0]?.title ?? null}
              />
            );
          })}
        </div>
      </section>

      <section className="tc-panel rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="tc-kicker" style={{ color: "var(--accent-public)" }}>
              Learning modules
            </p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
              English speaking, current affairs, and monthly updates
            </h2>
          </div>
          <span className="tc-code-chip">
            {otherFamilies.reduce(
              (total, definition) =>
                total + (groupedItems.get(definition.family)?.length ?? 0),
              0,
            )}{" "}
            items
          </span>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {otherFamilies.map((definition) => {
            const items = groupedItems.get(definition.family) ?? [];

            return (
              <FamilyDiscoveryCard
                key={definition.family}
                count={items.length}
                family={definition.family}
                firstTitle={items[0]?.title ?? null}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
