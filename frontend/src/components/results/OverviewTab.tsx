import { ListChecks, Kanban, Users, ShieldCheck, FileText, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ArtifactsPayload } from "@/lib/types";

export function OverviewTab({ artifacts }: { artifacts: ArtifactsPayload }) {
  const { requirements, features, personas, governance_report, foundry_evaluation, parsed_rfp } = artifacts;

  const reqByCategory = requirements.reduce(
    (acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const featByPriority = features.reduce(
    (acc, f) => {
      acc[f.priority] = (acc[f.priority] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Requirements"
          value={requirements.length}
          icon={<ListChecks className="h-5 w-5" />}
        >
          <div className="flex flex-wrap gap-1">
            {Object.entries(reqByCategory).map(([cat, count]) => (
              <span key={cat} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {cat}: {count}
              </span>
            ))}
          </div>
        </MetricCard>

        <MetricCard
          title="Total Features"
          value={features.length}
          icon={<Kanban className="h-5 w-5" />}
        >
          <div className="flex flex-wrap gap-1">
            {Object.entries(featByPriority).map(([p, count]) => (
              <span
                key={p}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  p === "P0"
                    ? "bg-destructive/15 text-destructive"
                    : p === "P1"
                    ? "bg-warning/15 text-warning"
                    : p === "P2"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p}: {count}
              </span>
            ))}
          </div>
        </MetricCard>

        <MetricCard
          title="Personas"
          value={personas.length}
          icon={<Users className="h-5 w-5" />}
        />

        <MetricCard
          title="RFP Title"
          value={parsed_rfp?.metadata?.rfp_title || "—"}
          icon={<FileText className="h-5 w-5" />}
          subtitle={parsed_rfp?.metadata?.issuing_organization || undefined}
        />
      </div>

      {/* Scores */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {governance_report && (
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
            <ScoreGauge
              score={governance_report.overall_score}
              label="Governance Score"
              status={governance_report.status}
            />
            <StatusBadge status={governance_report.status} />
          </div>
        )}

        {foundry_evaluation && (
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-6">
            <ScoreGauge score={foundry_evaluation.overall_score} label="AI Evaluation" />
            <span className="text-xs text-muted-foreground">{foundry_evaluation.evaluation_source.replace("_", " ")}</span>
          </div>
        )}

        {parsed_rfp?.metadata && (
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">RFP Metadata</h3>
            </div>
            <dl className="space-y-2 text-sm">
              {parsed_rfp.metadata.issue_date && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Issue Date</dt>
                  <dd className="text-foreground">{parsed_rfp.metadata.issue_date}</dd>
                </div>
              )}
              {parsed_rfp.metadata.due_date && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Due Date</dt>
                  <dd className="text-foreground">{parsed_rfp.metadata.due_date}</dd>
                </div>
              )}
              {parsed_rfp.metadata.estimated_budget && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd className="text-foreground">{parsed_rfp.metadata.estimated_budget}</dd>
                </div>
              )}
              {parsed_rfp.metadata.contact_info && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd className="truncate ml-4 text-foreground">{parsed_rfp.metadata.contact_info}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
