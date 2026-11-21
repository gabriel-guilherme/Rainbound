# Leitor — Rainbound

## Formatos

| Formato | Motor | Locator salvo |
| --- | --- | --- |
| PDF | `react-pdf` (`PdfReader.tsx`) | `pdf-page:<página>` |
| EPUB | `@likecoin/epub-ts` (`EpubReader.tsx`) | CFI do EPUB (`epubcfi(...)`) |
| CBZ | leitor próprio com `fflate` (`ComicReader.tsx`) | `cbz-page:<página>` |
| CBR | não suportado — converter para CBZ | — |

## Arquitetura

```
Reader.tsx            cabeçalho, setas, teclado, rodapé, salvamento de progresso
├── PdfReader         ┐
├── EpubReader        ├─ motores: implementam ReaderEngineProps
└── ComicReader       ┘
```

Cada motor recebe `ReaderEngineProps` (`readerTypes.ts`) e:

1. chama `onReady(controller)` quando o arquivo carrega, entregando um
   `ReaderController` (`previous`, `next` e `goToPage` ou `goToChapter`);
2. chama `onPageChange(pageInfo)` a cada mudança de posição (atualiza a UI);
3. chama `onProgressChange(progress)` quando a posição muda de verdade
   (o `Reader` salva com debounce via `useReaderProgress`);
4. (EPUB) chama `onContentsChange(chapters)` com o sumário.

Os motores guardam esses callbacks em um ref, para que o `Reader` possa
re-renderizar sem recarregar o livro.

## Cabeçalho

- **Selecionar página** (PDF/CBZ): campo "Ir para" + lista de páginas.
- **Sumário** (EPUB): lista de capítulos do TOC.
- **Configurações**: zoom e tema ainda não implementados.
- **Tela cheia**.

As setas ← → do teclado viram a página. No EPUB, o motor também escuta as
setas dentro do iframe do livro.

## Detalhes

- EPUB: as *locations* (base do progresso em %) são geradas uma vez e
  guardadas no `localStorage` por arquivo.
- CBZ: imagens ordenadas por nome em ordem natural (2 antes de 10);
  arquivos de `__MACOSX/` e ocultos são ignorados.
