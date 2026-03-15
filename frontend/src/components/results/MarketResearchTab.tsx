import type { MarketResearch } from "@/lib/types";

function renderSection(title: string, value: unknown): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") {
    return (
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>
      </section>
    );
  }
  if (Array.isArray(value)) {
    return (
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
        <ul className="list-disc pl-5 space-y-1">
          {value.map((v, i) => (
            <li key={i} className="text-sm text-foreground">{typeof v === "object" ? JSON.stringify(v) : String(v)}</li>
          ))}
        </ul>
      </section>
    );
  }
  if (typeof value === "object") {
    return (
      <section>
        <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
        <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k}>{renderSection(k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), v)}</div>
          ))}
        </div>
      </section>
    );
  }
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-foreground">{String(value)}</p>
    </section>
  );
}

export function MarketResearchTab({ data }: { data: MarketResearch | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-muted-foreground">No market research available.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="rounded-xl border bg-card p-6 card-elevated">
          {renderSection(key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), value)}
        </div>
      ))}
    </div>
  );
}
