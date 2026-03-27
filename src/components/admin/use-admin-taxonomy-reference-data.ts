"use client";

import { useMemo } from "react";
import { adminQueryKeys } from "@/lib/api/query-keys";
import { useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import {
  listAdminExamTracks,
  listAdminMediums,
  listAdminSubjects,
  listAdminTags,
  listAdminTopics,
} from "@/lib/admin";

export function useAdminTaxonomyReferenceData() {
  const authSession = useAuthSession();
  const canReadTaxonomy = authSession.hasPermission("academics.taxonomy.read");

  const examTracksQuery = useAuthenticatedQuery({
    enabled: canReadTaxonomy,
    queryFn: listAdminExamTracks,
    queryKey: adminQueryKeys.taxonomy("examTracks"),
    staleTime: 60_000,
  });
  const mediumsQuery = useAuthenticatedQuery({
    enabled: canReadTaxonomy,
    queryFn: listAdminMediums,
    queryKey: adminQueryKeys.taxonomy("mediums"),
    staleTime: 60_000,
  });
  const subjectsQuery = useAuthenticatedQuery({
    enabled: canReadTaxonomy,
    queryFn: (accessToken) => listAdminSubjects(accessToken, {}),
    queryKey: adminQueryKeys.taxonomy("subjects", {}),
    staleTime: 60_000,
  });
  const topicsQuery = useAuthenticatedQuery({
    enabled: canReadTaxonomy,
    queryFn: (accessToken) => listAdminTopics(accessToken, {}),
    queryKey: adminQueryKeys.taxonomy("topics", {}),
    staleTime: 60_000,
  });
  const tagsQuery = useAuthenticatedQuery({
    enabled: canReadTaxonomy,
    queryFn: listAdminTags,
    queryKey: adminQueryKeys.taxonomy("tags"),
    staleTime: 60_000,
  });

  const subjects = useMemo(() => subjectsQuery.data ?? [], [subjectsQuery.data]);
  const topics = useMemo(() => topicsQuery.data ?? [], [topicsQuery.data]);

  const subjectsByExamTrackId = useMemo(() => {
    return subjects.reduce<Record<string, typeof subjects>>(
      (accumulator, subject) => {
        accumulator[subject.examTrackId] = [
          ...(accumulator[subject.examTrackId] ?? []),
          subject,
        ];
        return accumulator;
      },
      {},
    );
  }, [subjects]);

  const topicsBySubjectId = useMemo(() => {
    return topics.reduce<Record<string, typeof topics>>(
      (accumulator, topic) => {
        accumulator[topic.subjectId] = [
          ...(accumulator[topic.subjectId] ?? []),
          topic,
        ];
        return accumulator;
      },
      {},
    );
  }, [topics]);

  return {
    canReadTaxonomy,
    examTracks: examTracksQuery.data ?? [],
    mediums: mediumsQuery.data ?? [],
    subjects,
    subjectsByExamTrackId,
    tags: tagsQuery.data ?? [],
    topics,
    topicsBySubjectId,
    isLoading:
      examTracksQuery.isLoading ||
      mediumsQuery.isLoading ||
      subjectsQuery.isLoading ||
      topicsQuery.isLoading ||
      tagsQuery.isLoading,
  };
}
