import { useQuery } from "@tanstack/react-query";
import { getJobStatus } from "@/lib/api";
import type { RFPJob } from "@/lib/types";

export function useJobStatus(jobId: string | undefined, enabled = true) {
  return useQuery<RFPJob>({
    queryKey: ["jobStatus", jobId],
    queryFn: () => getJobStatus(jobId!),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 3000;
    },
  });
}
