import { ArrowUpRight } from "lucide-react";

export function AnimatedArrowIcon() {
  return (
    <span className="animated-arrow" aria-hidden="true">
      <ArrowUpRight className="animated-arrow-primary" />
      <ArrowUpRight className="animated-arrow-secondary" />
    </span>
  );
}
