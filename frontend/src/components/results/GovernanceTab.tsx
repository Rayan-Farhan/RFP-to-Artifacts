import { AlertTriangle, AlertCircle, Flag } from "lucide-react";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { GovernanceReport } from "@/lib/types";

export function GovernanceTab({ report }: { report: GovernanceReport | null }) {
  if (!report) return <p className="text-muted-foreground">No governance report available.</p>;

  const checks = report.checks ?? [];
  const missingInfo = report.missing_information ?? [];
  const contradictions = report.contradictions ?? [];
  const riskFlags = report.risk_flags ?? [];

  return (
    <div className="space-y-8">
      {/* Top */}
      <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6 card-elevated sm:flex-row sm:items-start sm:gap-8">
        <ScoreGauge score={report.overall_score ?? 0} size={140} label="Overall Score" status={report.status} />
        <div className="flex-1">
          <div className="mb-3">
            <StatusBadge status={report.status ?? "pending"} />
          </div>
          <p className="text-sm text-foreground leading-relaxed">{report.summary ?? ""}</p>
        </div>
      </div>

      {/* Checks */}
      {checks.length > 0 && (
      <div>
        <h2 className="mb-5 text-lg font-semibold text-foreground">Quality Checks</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {checks.map((check, i) => (
            <div key={i} className="rounded-xl border bg-card p-5 card-elevated transition-all duration-200 hover:border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{check.check_name}</h3>
                <StatusBadge status={check.status} />
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Score</span>
                  <span className="font-medium">{check.score}/10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      check.status === "pass"
                        ? "bg-success"
                        : check.status === "warning"
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${(check.score / 10) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{check.findings}</p>
              {(check.recommendations ?? []).length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                  {check.recommendations.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Bottom sections */}
      <div className="grid gap-4 sm:grid-cols-3">
        {missingInfo.length > 0 && (
          <div className="rounded-xl border bg-card p-5 card-elevated">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-warning/10 p-1.5">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Missing Information</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {missingInfo.map((m, i) => (
                <li key={i}>• {m}</li>
              ))}
            </ul>
          </div>
        )}
        {contradictions.length > 0 && (
          <div className="rounded-xl border bg-card p-5 card-elevated">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-destructive/10 p-1.5">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Contradictions</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {contradictions.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        )}
        {riskFlags.length > 0 && (
          <div className="rounded-xl border bg-card p-5 card-elevated">
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-destructive/10 p-1.5">
                <Flag className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Risk Flags</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {riskFlags.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
