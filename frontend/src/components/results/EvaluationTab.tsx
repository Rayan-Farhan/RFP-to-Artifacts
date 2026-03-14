import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { rerunEvaluation } from "@/lib/api";
import { toast } from "sonner";
import type { EvaluationReport } from "@/lib/types";

export function EvaluationTab({ evaluation, jobId }: { evaluation: EvaluationReport | null; jobId: string }) {
  const [rerunning, setRerunning] = useState(false);

  const handleRerun = async () => {
    setRerunning(true);
    try {
      await rerunEvaluation(jobId);
      toast.success("Evaluation re-run triggered. Refresh to see updated results.");
    } catch {
      toast.error("Failed to re-run evaluation");
    } finally {
      setRerunning(false);
    }
  };

  if (!evaluation) return <p className="text-muted-foreground">No evaluation report available.</p>;

  return (
    <div className="space-y-8">
      {/* Source & Overall */}
      <div className="flex flex-col items-center gap-6 rounded-lg border bg-card p-6 sm:flex-row sm:items-start sm:gap-10">
        <ScoreGauge score={evaluation.overall_score} size={140} label="Overall Score" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                evaluation.evaluation_source === "azure_ai_foundry"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {evaluation.evaluation_source === "azure_ai_foundry" ? "Azure AI Foundry" : "Offline Heuristic"}
            </span>
            <Button variant="outline" size="sm" onClick={handleRerun} disabled={rerunning} className="gap-1.5">
              {rerunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-run
            </Button>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{evaluation.summary}</p>
        </div>
      </div>

      {/* SOW Evaluation */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">SOW Evaluation</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(["relevance", "coherence", "groundedness"] as const).map((metric) => (
            <div key={metric} className="flex flex-col items-center rounded-lg border bg-card p-6">
              <ScoreGauge score={evaluation.sow_evaluation[metric]} size={100} label={metric.charAt(0).toUpperCase() + metric.slice(1)} />
            </div>
          ))}
        </div>
      </div>

      {/* Requirements Evaluation */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Requirements Evaluation</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col items-center rounded-lg border bg-card p-6">
            <ScoreGauge score={evaluation.requirements_evaluation.relevance} size={100} label="Relevance" />
          </div>
          <div className="flex flex-col items-center rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">Requirements Count</p>
            <p className="mt-2 text-4xl font-bold text-foreground">{evaluation.requirements_evaluation.count}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
