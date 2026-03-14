import { Check, AlertTriangle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { UserPersona, InterviewQuestion } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  discovery: "bg-primary/15 text-primary",
  validation: "bg-success/15 text-success",
  prioritization: "bg-warning/15 text-warning",
};

export function PersonasTab({ personas, questions }: { personas: UserPersona[]; questions: InterviewQuestion[] }) {
  const grouped = questions.reduce(
    (acc, q) => {
      acc[q.category] = acc[q.category] || [];
      acc[q.category].push(q);
      return acc;
    },
    {} as Record<string, InterviewQuestion[]>
  );

  return (
    <div className="space-y-10">
      {/* Persona Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">User Personas</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {personas.map((p, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
              <p className="text-sm text-primary">{p.role}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{p.context}</p>

              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goals</h4>
                <ul className="space-y-1">
                  {p.goals.map((g, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pain Points</h4>
                <ul className="space-y-1">
                  {p.pain_points.map((pp, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      {pp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interview Questions */}
      {questions.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Interview Questions</h2>
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(grouped).map(([category, qs]) => (
              <AccordionItem key={category} value={category} className="rounded-lg border bg-card px-4">
                <AccordionTrigger className="text-sm font-medium text-foreground capitalize hover:no-underline">
                  {category} ({qs.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {qs.map((q, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-foreground">{q.question}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {q.target_persona && (
                            <span className={`rounded-full px-2 py-0.5 text-xs ${CATEGORY_COLORS[q.category] || "bg-muted text-muted-foreground"}`}>
                              {q.target_persona}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{q.rationale}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
}
