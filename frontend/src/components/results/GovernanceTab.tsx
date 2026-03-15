import { AlertTriangle, AlertCircle, Flag } from "lucide-react";
import { ScoreGauge } from "@/components/shared/ScoreGauge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { GovernanceReport } from "@/lib/types";

/** Normalize a status string to lowercase "pass" | "warning" | "fail" | "pending" */
function normalizeStatus(s: unknown): "pass" | "warning" | "fail" | "pending" {
  const lower = String(s ?? "").toLowerCase();
  if (lower === "pass" || lower === "warning" || lower === "fail") return lower;
  return "pending";
}

export function GovernanceTab({ report }: { report: GovernanceReport | null }) {
  if (!report) return <p className="text-muted-foreground">No governance report available.</p>;

  // Defensively coerce top-level fields — LLMs sometimes return numbers as strings
  const overallScore = Number(report.overall_score ?? 0) || 0;
  const overallStatus = normalizeStatus(report.status);

  const checks = Array.isArray(report.checks) ? report.checks : [];
  const missingInfo = Array.isArray(report.missing_information) ? report.missing_information : [];
  const contradictions = Array.isArray(report.contradictions) ? report.contradictions : [];
  const riskFlags = Array.isArray(report.risk_flags) ? report.risk_flags : [];

  return (
    <div className="space-y-8">
      {/* Top */}
      <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 sm:flex-row sm:items-start sm:gap-8">
        <ScoreGauge score={overallScore} size={140} label="Overall Score" status={overallStatus} />
        <div className="flex-1">
          <div className="mb-2">
            <StatusBadge status={overallStatus} />
          </div>
          <p className="text-sm text-foreground leading-relaxed">{report.summary ?? ""}</p>
        </div>
      </div>

      {/* Checks */}
      {checks.length > 0 && (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quality Checks</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {checks.map((check, i) => {
            const checkScore = Number(check?.score ?? 0) || 0;
            const checkStatus = normalizeStatus(check?.status);
            return (
            <div key={i} className="rounded-lg border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-foreground">{check.check_name}</h3>
                <StatusBadge status={checkStatus} />
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Score</span>
                  <span>{checkScore}/10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      checkStatus === "pass"
                        ? "bg-success"
                        : checkStatus === "warning"
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                    style={{ width: `${(checkScore / 10) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{check.findings}</p>
              {(check.recommendations ?? []).length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                  {check.recommendations.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              )}
            </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Bottom sections */}
      <div className="grid gap-4 sm:grid-cols-3">
        {missingInfo.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <h3 className="text-sm font-medium text-foreground">Missing Information</h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {missingInfo.map((m, i) => (
                <li key={i}>• {m}</li>
              ))}
            </ul>
          </div>
        )}
        {contradictions.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-medium text-foreground">Contradictions</h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {contradictions.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        )}
        {riskFlags.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-medium text-foreground">Risk Flags</h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
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
