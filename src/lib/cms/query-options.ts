import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";
import { getPublicCmsPage, resolvePublicCms } from "@/lib/cms/cms-api";

export function publicCmsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.cms.resolve(),
    queryFn: resolvePublicCms,
    staleTime: 60_000,
  });
}

export function publicCmsPageQueryOptions(slug: string) {
  return queryOptions({
    queryKey: queryKeys.cms.page(slug),
    queryFn: () => getPublicCmsPage(slug),
    staleTime: 60_000,
  });
}
