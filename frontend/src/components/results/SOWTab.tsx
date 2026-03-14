import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { StatementOfWork } from "@/lib/types";

export function SOWTab({ sow }: { sow: StatementOfWork | null }) {
  const [copied, setCopied] = useState(false);

  if (!sow) return <p className="text-muted-foreground">No Statement of Work generated.</p>;

  const copyToClipboard = () => {
    const text = [
      `# ${sow.project_title}`,
      `\n## Executive Summary\n${sow.executive_summary}`,
      `\n## Scope\n### ${sow.scope.title}\n${sow.scope.content}`,
      `\n## Deliverables\n${sow.deliverables.map((d, i) => `${i + 1}. ${d}`).join("\n")}`,
      `\n## Timeline\n### ${sow.timeline.title}\n${sow.timeline.content}`,
      `\n## Assumptions\n${sow.assumptions.map((a) => `- ${a}`).join("\n")}`,
      `\n## Constraints\n${sow.constraints.map((c) => `- ${c}`).join("\n")}`,
      `\n## Acceptance Criteria\n${sow.acceptance_criteria.map((a, i) => `${i + 1}. ${a}`).join("\n")}`,
      sow.estimated_effort ? `\n## Estimated Effort\n${sow.estimated_effort}` : "",
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-1.5">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy to Clipboard"}
        </Button>
      </div>

      <article className="space-y-8 rounded-lg border bg-card p-8">
        <h1 className="text-2xl font-bold text-foreground">{sow.project_title}</h1>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Executive Summary</h2>
          <p className="text-sm text-foreground leading-relaxed">{sow.executive_summary}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">{sow.scope.title}</h2>
          <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{sow.scope.content}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Deliverables</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground">
            {sow.deliverables.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">{sow.timeline.title}</h2>
          <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{sow.timeline.content}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Assumptions</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {sow.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Constraints</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
            {sow.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Acceptance Criteria</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-foreground">
            {sow.acceptance_criteria.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        </section>

        {sow.estimated_effort && (
          <section className="rounded-lg bg-muted p-4">
            <h2 className="mb-1 text-sm font-semibold text-foreground">Estimated Effort</h2>
            <p className="text-lg font-bold text-primary">{sow.estimated_effort}</p>
          </section>
        )}
      </article>
    </div>
  );
}
