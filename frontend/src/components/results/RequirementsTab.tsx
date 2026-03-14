import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Requirement } from "@/lib/types";

const PRIORITY_STYLES: Record<string, string> = {
  "must-have": "bg-destructive/15 text-destructive",
  "should-have": "bg-warning/15 text-warning",
  "could-have": "bg-primary/15 text-primary",
  "wont-have": "bg-muted text-muted-foreground",
  "won't-have": "bg-muted text-muted-foreground",
};

const CATEGORY_STYLES: Record<string, string> = {
  functional: "bg-primary/15 text-primary",
  "non-functional": "bg-warning/15 text-warning",
  constraint: "bg-destructive/15 text-destructive",
  compliance: "bg-success/15 text-success",
};

export function RequirementsTab({ requirements }: { requirements: Requirement[] }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [priFilter, setPriFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requirements.filter((r) => {
      if (catFilter && r.category !== catFilter) return false;
      if (priFilter && r.priority !== priFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return r.title.toLowerCase().includes(s) || r.description.toLowerCase().includes(s) || r.id.toLowerCase().includes(s);
      }
      return true;
    });
  }, [requirements, search, catFilter, priFilter]);

  const categories = [...new Set(requirements.map((r) => r.category))];
  const priorities = [...new Set(requirements.map((r) => r.priority))];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-muted-foreground">{requirements.length} total</span>
        {Object.entries(
          requirements.reduce((a, r) => { a[r.category] = (a[r.category] || 0) + 1; return a; }, {} as Record<string, number>)
        ).map(([cat, n]) => (
          <span key={cat} className={`rounded-full px-2 py-0.5 text-xs ${CATEGORY_STYLES[cat] || "bg-muted text-muted-foreground"}`}>
            {cat}: {n}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requirements…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCatFilter(catFilter === c ? null : c)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                catFilter === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => setPriFilter(priFilter === p ? null : p)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                priFilter === p ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <>
                <tr
                  key={r.id}
                  className="border-b cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3 text-foreground">{r.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${CATEGORY_STYLES[r.category] || ""}`}>{r.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_STYLES[r.priority] || ""}`}>{r.priority}</span>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-detail`} className="border-b bg-muted/20">
                    <td colSpan={4} className="px-4 py-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{r.description}</p>
                      {r.source_section && (
                        <p className="mt-2 text-xs text-muted-foreground">Source: {r.source_section}</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No requirements match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
