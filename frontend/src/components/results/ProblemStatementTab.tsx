import type { ProblemStatement } from "@/lib/types";

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value == null) return <span className="text-muted-foreground italic">—</span>;
  if (typeof value === "string") return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{value}</p>;
  if (typeof value === "number" || typeof value === "boolean") return <span className="text-sm text-foreground">{String(value)}</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        {value.map((v, i) => (
          <li key={i} className="text-sm text-foreground">{typeof v === "object" ? renderValue(v, depth + 1) : String(v)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div className={depth > 0 ? "pl-4 border-l-2 border-border space-y-3" : "space-y-5"}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {k.replace(/_/g, " ")}
            </h4>
            {renderValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function ProblemStatementTab({ data }: { data: ProblemStatement | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-muted-foreground">No problem statement available.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <article className="space-y-6 rounded-xl border bg-card p-8 card-elevated">
        <h1 className="text-xl font-bold text-foreground">Problem Statement</h1>
        {renderValue(data)}
      </article>
    </div>
  );
}
