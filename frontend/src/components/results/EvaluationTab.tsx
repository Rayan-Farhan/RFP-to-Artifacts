import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { rerunEvaluation } from "@/lib/api";
import { toast } from "sonner";
import type { EvaluationReport } from "@/lib/types";

function extractScore(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (typeof obj.score === "number") return obj.score;
    const first = Object.values(obj)[0];
    if (typeof first === "number") return first;
  }
  return 0;
}

export function EvaluationTab({ evaluation: initialEval, jobId }: { evaluation: EvaluationReport | null; jobId: string }) {
  const [evaluation, setEvaluation] = useState(initialEval);
  const [rerunning, setRerunning] = useState(false);

  const handleRerun = async () => {
    setRerunning(true);
    try {
      const updated = await rerunEvaluation(jobId);
      setEvaluation(updated);
      toast.success("Evaluation re-run completed.");
    } catch {
      toast.error("Failed to re-run evaluation");
    } finally {
      setRerunning(false);
    }
  };

  if (!evaluation) return <p className="text-muted-foreground">No evaluation report available.</p>;

  const isOffline = evaluation.evaluation_source === "offline_heuristic";

  return (
    <div className="space-y-8">
      {/* Source & Overall */}
      <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6 card-elevated sm:flex-row sm:items-start sm:gap-10">
        <ScoreGauge score={evaluation.overall_score ?? 0} size={140} label="Overall Score" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                !isOffline
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {!isOffline ? "Azure AI Foundry" : "Offline Heuristic"}
            </span>
            <Button variant="outline" size="sm" onClick={handleRerun} disabled={rerunning} className="gap-1.5 rounded-lg">
              {rerunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Re-run
            </Button>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{evaluation.summary}</p>
        </div>
      </div>

      {/* Offline heuristic checks */}
      {isOffline && evaluation.checks && evaluation.checks.length > 0 && (
        <div>
          <h2 className="mb-5 text-lg font-semibold text-foreground">Evaluation Checks</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evaluation.checks.map((check, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 card-elevated transition-all duration-200 hover:border-primary/20">
                <h3 className="text-sm font-medium text-foreground capitalize">
                  {check.metric.replace(/_/g, " ")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">Value: {String(check.value)}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Score</span>
                    <span className="font-medium">{check.score}/{check.max_score}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        check.score / check.max_score >= 0.8
                          ? "bg-success"
                          : check.score / check.max_score >= 0.5
                          ? "bg-warning"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${(check.score / check.max_score) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Azure AI Foundry: SOW Evaluation */}
      {!isOffline && evaluation.sow_evaluation && (
        <div>
          <h2 className="mb-5 text-lg font-semibold text-foreground">SOW Evaluation</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["relevance", "coherence", "groundedness"] as const).map((metric) => (
              <div key={metric} className="flex flex-col items-center rounded-xl border bg-card p-6 card-elevated">
                <ScoreGauge
                  score={extractScore(evaluation.sow_evaluation![metric])}
                  size={100}
                  label={metric.charAt(0).toUpperCase() + metric.slice(1)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Azure AI Foundry: Requirements Evaluation */}
      {!isOffline && evaluation.requirements_evaluation && (
        <div>
          <h2 className="mb-5 text-lg font-semibold text-foreground">Requirements Evaluation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col items-center rounded-xl border bg-card p-6 card-elevated">
              <ScoreGauge
                score={extractScore(evaluation.requirements_evaluation.relevance)}
                size={100}
                label="Relevance"
              />
            </div>
            <div className="flex flex-col items-center rounded-xl border bg-card p-6 card-elevated">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Requirements Count</p>
              <p className="mt-2 text-4xl font-bold text-foreground">{evaluation.requirements_evaluation.count}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
