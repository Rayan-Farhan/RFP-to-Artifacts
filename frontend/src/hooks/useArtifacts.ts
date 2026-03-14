import { useQuery } from "@tanstack/react-query";
import { getArtifacts } from "@/lib/api";
import type { ArtifactsResponse } from "@/lib/types";

export function useArtifacts(jobId: string | undefined, enabled = true) {
  return useQuery<ArtifactsResponse>({
    queryKey: ["artifacts", jobId],
    queryFn: () => getArtifacts(jobId!),
    enabled: !!jobId && enabled,
    retry: 1,
  });
}
