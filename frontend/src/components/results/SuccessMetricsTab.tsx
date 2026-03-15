import type { SuccessMetrics } from "@/lib/types";

function renderBlock(title: string, value: unknown): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") {
    return (
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</h4>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
      </div>
    );
  }
  if (Array.isArray(value)) {
    return (
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
        <div className="space-y-2">
          {value.map((item, i) => (
            <div key={i} className="rounded-xl border bg-muted/20 p-3.5">
              {typeof item === "object" && item !== null ? (
                <div className="space-y-1">
                  {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">{k.replace(/_/g, " ")}:</span>
                      <span className="text-sm text-foreground">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-foreground">{String(item)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k}>{renderBlock(k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), v)}</div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{title}</h4>
      <p className="text-sm text-foreground">{String(value)}</p>
    </div>
  );
}

export function SuccessMetricsTab({ data }: { data: SuccessMetrics | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-muted-foreground">No success metrics available.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="rounded-xl border bg-card p-6 card-elevated">
          {renderBlock(key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), value)}
        </div>
      ))}
    </div>
  );
}
