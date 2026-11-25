type ProfileStatsProps = {
  stats: {
    year: string;
    readThisYear: number;
    readingNow: number;
    secondsThisYear: number;
    currentStreak: number;
  };
};

function formatHours(seconds: number) {
  return seconds >= 3600 ? `${Math.floor(seconds / 3600)} h` : `${Math.floor(seconds / 60)} min`;
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  const items = [
    { value: String(stats.readThisYear), label: `lidos em ${stats.year}` },
    {
      value: String(stats.currentStreak),
      label: stats.currentStreak === 1 ? "dia seguido lendo" : "dias seguidos lendo",
    },
    { value: formatHours(stats.secondsThisYear), label: `lidas em ${stats.year}` },
    { value: String(stats.readingNow), label: "lendo agora" },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse gap-1 bg-primary px-4 py-4 sm:px-5">
          <dt className="text-sm text-contrast/75">{item.label}</dt>
          <dd className="title-shelf text-5xl text-contrast">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
