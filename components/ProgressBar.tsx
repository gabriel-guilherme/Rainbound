type ProgressBarProps = {
  percentage: number;
};

export default function ProgressBar({ percentage }: ProgressBarProps) {
  const progress = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="text-xs text-contrast/70">
      <div className="mb-1 flex justify-end">
        <span>{progress.toFixed(2)}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-contrast/30">
        <div
          className="h-2 rounded-full bg-interaction transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
