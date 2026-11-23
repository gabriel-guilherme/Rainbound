type ChaptersSummaryProps = {
  setShowContents: (show: boolean) => void
  chapters: { href: string; title: string }[]
  handleChapterSelect: (href: string) => void
}

export default function ChaptersSummary({setShowContents, chapters, handleChapterSelect}: ChaptersSummaryProps){
    return(
        <aside className="absolute right-5 top-20 z-50 w-80 rounded-lg bg-secondary p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Capítulos</h2>

            <button
              type="button"
              onClick={() => setShowContents(false)}
              className="cursor-pointer text-sm opacity-70 hover:opacity-100"
            >
              Fechar
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {chapters.length === 0 ? (
              <p className="text-sm opacity-60">Nenhum capítulo encontrado.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {chapters.map((chapter, index) => (
                  <button
                    key={`${chapter.href}-${index}`}
                    type="button"
                    onClick={() => handleChapterSelect(chapter.href)}
                    className="cursor-pointer rounded-md px-3 py-2 text-left transition hover:bg-primary"
                  >
                    {chapter.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
    )
}