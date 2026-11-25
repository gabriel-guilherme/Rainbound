import RainImpacts from "./RainImpacts";
import WindowDrops from "./WindowDrops";

export default function WindowFrame({ isPaused }: { isPaused: boolean }) {
  return (
    <>
      {/* Vidro */}
      <div className="absolute inset-0 bg-white/[0.03]" />

      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />

      <div className="absolute inset-0 backdrop-blur-[1px]" />
      <WindowDrops isPaused={isPaused} />
      <RainImpacts isPaused={isPaused} />

      {/* Rebaixo interno da janela */}
      <div className=" absolute inset-[20px] border-[6px] border-primary/70 shadow-[inset_0_0_18px_rgba(0,0,0,0.9)]" />

      {/* Estrutura interna */}
      <div className="absolute inset-[26px]">
        {/* Barra vertical */}
        <div className="absolute left-1/2 top-0 h-full w-5 -translate-x-1/2 bg-primary shadow-[4px_0_8px_rgba(0,0,0,0.4),-2px_0_5px_rgba(255,255,255,0.08)]" />

        {/* Barra horizontal */}
        <div className="absolute left-0 top-1/2 h-5 w-full -translate-y-1/2 bg-primary shadow-[0_4px_8px_rgba(0,0,0,0.4),0_-2px_5px_rgba(255,255,255,0.08)]" />
      </div>

      {/* Moldura externa */}
      <div className="absolute inset-0 border-[20px] border-primary shadow-[   inset_0_0_12px_rgba(0,0,0,1),   0_8px_20px_rgba(0,0,0,0.5) ]" />

      {/* Pequeno highlight na parte interna da moldura */}
      <div className="pointer-events-none absolute inset-[20px] border border-white/[0.08]" />
    </>
  );
}
