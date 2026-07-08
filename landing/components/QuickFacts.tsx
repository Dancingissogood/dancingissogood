import type { QuickFact } from "@/content/site";

type QuickFactsProps = {
  facts: QuickFact[];
};

export function QuickFacts({ facts }: QuickFactsProps) {
  return (
    <section className="quick-facts" aria-label="Program highlights">
      {facts.map((fact) => (
        <div data-reveal key={fact.label}>
          <span>{fact.label}</span>
          <strong>{fact.value}</strong>
        </div>
      ))}
    </section>
  );
}
