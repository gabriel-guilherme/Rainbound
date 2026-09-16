import Link from "next/link";

export default function Footer() {
  return (
    <footer className="font-sans relative overflow-hidden bg-primary px-6 py-20 text-contrast sm:px-10 lg:px-16 xl:px-24">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center text-center">
        {/* Branding */}
        <div className="font-display flex flex-col items-center gap-5">
          <span className="text-xs tracking-[0.35em] text-contrast/40">
            RAINBOUND
          </span>

          <h2 className="text-[clamp(2.5rem,6vw,6rem)] leading-none tracking-tight">
            Keep a place
            <br />
            for every story.
          </h2>

          <p className="max-w-md text-[clamp(0.9rem,1.2vw,1.1rem)] text-contrast/50">
            Your books. Your thoughts. Your journey.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/library"
          className="mt-10 rounded-full border border-contrast/30 px-6 py-3 text-sm text-contrast transition-colors duration-300 hover:border-interaction hover:bg-interaction hover:text-contrast"
        >
          Go to your library →
        </Link>

        {/* Navigation */}
        <nav className="mt-20 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-contrast/50">
          <Link href="/" className="transition-colors hover:text-contrast">
            HOME
          </Link>

          <Link
            href="/library"
            className="transition-colors hover:text-contrast"
          >
            LIBRARY
          </Link>

          <Link
            href="/library/new"
            className="transition-colors hover:text-contrast"
          >
            ADD BOOK
          </Link>
        </nav>

        {/* Bottom */}
        <div className="mt-16 flex flex-col items-center gap-4 text-xs text-contrast/30">
          <span className="tracking-[0.5em]">· · ·</span>

          <span>Made with care</span>

          <span>© 2026 Rainbound</span>
        </div>
      </div>
    </footer>
  );
}
