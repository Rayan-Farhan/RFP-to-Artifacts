import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ParsedRFP } from "@/lib/types";

const SECTION_LABELS: Record<string, string> = {
  executive_summary: "Executive Summary",
  project_overview: "Project Overview",
  scope_of_work: "Scope of Work",
  requirements: "Requirements",
  technical_requirements: "Technical Requirements",
  deliverables: "Deliverables",
  timeline: "Timeline",
  evaluation_criteria: "Evaluation Criteria",
  budget_constraints: "Budget Constraints",
  submission_guidelines: "Submission Guidelines",
  terms_and_conditions: "Terms & Conditions",
  other: "Other",
};

export function ParsedRFPTab({ parsedRfp }: { parsedRfp: ParsedRFP | null }) {
  if (!parsedRfp) return <p className="text-muted-foreground">No parsed RFP data available.</p>;

  const { metadata, sections } = parsedRfp;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Metadata */}
      <div>
        <h2 className="mb-5 text-lg font-semibold text-foreground">Metadata</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="rounded-xl border bg-card p-4 card-elevated transition-all duration-200 hover:border-primary/20">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>
              <p className="mt-1.5 text-sm font-medium text-foreground">{value || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div>
        <h2 className="mb-5 text-lg font-semibold text-foreground">Sections</h2>
        <Accordion type="multiple" className="space-y-2">
          {Object.entries(SECTION_LABELS).map(([key, label]) => {
            const content = sections[key as keyof typeof sections];
            return (
              <AccordionItem key={key} value={key} className="rounded-xl border bg-card px-5">
                <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                  <div className="flex items-center gap-2">
                    {label}
                    {!content && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        Not found
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {content ? (
                    <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{content}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Not found in RFP</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
