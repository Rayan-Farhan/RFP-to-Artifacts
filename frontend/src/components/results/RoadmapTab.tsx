import type { Roadmap } from "@/lib/types";

function renderPhase(title: string, value: unknown): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") {
    return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>;
  }
  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border bg-muted/30 p-3">
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
    );
  }
  if (typeof value === "object") {
    return (
      <div className="space-y-3">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {k.replace(/_/g, " ")}
            </h4>
            {renderPhase(k, v)}
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-foreground">{String(value)}</p>;
}

export function RoadmapTab({ data }: { data: Roadmap | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-muted-foreground">No roadmap available.</p>;
  }

  const entries = Object.entries(data);

  return (
    <div className="mx-auto max-w-4xl">
      {/* Timeline-style layout */}
      <div className="relative space-y-6">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
        {entries.map(([key, value], i) => (
          <div key={key} className="relative pl-10">
            {/* Timeline dot */}
            <div
              className={`absolute left-2.5 top-4 h-3 w-3 rounded-full border-2 ${
                i === 0
                  ? "border-primary bg-primary"
                  : "border-muted-foreground bg-background"
              }`}
            />
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-base font-semibold text-foreground mb-3">
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </h3>
              {renderPhase(key, value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
