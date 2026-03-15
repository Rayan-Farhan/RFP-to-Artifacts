import { useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Feature } from "@/lib/types";

const PRIORITY_COLORS: Record<string, string> = {
  P0: "border-destructive/40 bg-destructive/5",
  P1: "border-warning/40 bg-warning/5",
  P2: "border-primary/40 bg-primary/5",
  P3: "border-border bg-muted/30",
};

const PRIORITY_LABELS: Record<string, string> = {
  P0: "Critical",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

const PRIORITY_BADGE: Record<string, string> = {
  P0: "bg-destructive/10 text-destructive",
  P1: "bg-warning/10 text-warning",
  P2: "bg-primary/10 text-primary",
  P3: "bg-muted text-muted-foreground",
};

export function FeaturesTab({ features }: { features: Feature[] }) {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (view === "kanban") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setView("table")} className="gap-1.5 rounded-lg">
            <Table2 className="h-4 w-4" /> Table
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(["P0", "P1", "P2", "P3"] as const).map((p) => {
            const items = features.filter((f) => f.priority === p);
            return (
              <div key={p}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_BADGE[p]}`}>{p}</span>
                  <span className="text-sm text-muted-foreground">{PRIORITY_LABELS[p]} ({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((f) => (
                    <div
                      key={f.id}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-200 hover:shadow-md ${PRIORITY_COLORS[f.priority]}`}
                      onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[10px] text-muted-foreground">{f.id}</p>
                          <p className="text-sm font-medium text-foreground">{f.title}</p>
                        </div>
                        {f.priority_score != null && (
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {f.priority_score}/10
                          </span>
                        )}
                      </div>
                      {f.linked_requirements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {f.linked_requirements.map((r) => (
                            <span key={r} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      {expanded === f.id && (
                        <div className="mt-3 space-y-2 border-t pt-3 text-sm">
                          <p className="text-foreground leading-relaxed">{f.description}</p>
                          {f.user_story && <p className="italic text-muted-foreground">{f.user_story}</p>}
                          {f.acceptance_criteria.length > 0 && (
                            <ul className="list-disc pl-4 text-muted-foreground">
                              {f.acceptance_criteria.map((ac, i) => (
                                <li key={i}>{ac}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                      No features
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => setView("kanban")} className="gap-1.5 rounded-lg">
          <LayoutGrid className="h-4 w-4" /> Kanban
        </Button>
      </div>
      <div className="rounded-xl border overflow-hidden card-elevated">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Linked Reqs</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <>
                <tr
                  key={f.id}
                  className="border-b cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.id}</td>
                  <td className="px-4 py-3 text-foreground">{f.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] ${PRIORITY_BADGE[f.priority]}`}>{f.priority}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{f.priority_score ?? "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-muted-foreground">
                    {f.linked_requirements.join(", ") || "—"}
                  </td>
                </tr>
                {expanded === f.id && (
                  <tr key={`${f.id}-detail`} className="border-b bg-accent/30">
                    <td colSpan={5} className="px-4 py-4 space-y-2">
                      <p className="text-sm text-foreground leading-relaxed">{f.description}</p>
                      {f.user_story && <p className="text-sm italic text-muted-foreground">{f.user_story}</p>}
                      {f.acceptance_criteria.length > 0 && (
                        <ul className="list-disc pl-4 text-sm text-muted-foreground">
                          {f.acceptance_criteria.map((ac, i) => <li key={i}>{ac}</li>)}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
