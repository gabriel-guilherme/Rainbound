import { formatReadPages, type ReadPages } from "@/lib/reading/pages";

type ProgressLabelProps = {
  percentage: number;
  pages: ReadPages | null;
  suffix?: string;
};

export default function ProgressLabel({
  percentage,
  pages,
  suffix,
}: ProgressLabelProps) {
  const percentText = `${Math.round(percentage)}%${suffix ? ` ${suffix}` : ""}`;

  if (!pages) {
    return <span className="tabular-nums">{percentText}</span>;
  }

  const pagesText = formatReadPages(pages);

  return (
    <span className="group/progress tabular-nums" title={pagesText}>
      <span className="group-hover/progress:hidden">{percentText}</span>
      <span className="hidden group-hover/progress:inline">{pagesText}</span>
    </span>
  );
}
