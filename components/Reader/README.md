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
Reader.tsx            cabeçalho, setas, teclado, rodapé, configurações
├── useReaderProgress salvamento de progresso (debounce + ao sair/fechar)
├── useReaderSettings zoom e tema (localStorage, por navegador)
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

Além disso, todo motor recebe `zoom` e `theme` (`ReaderDisplayProps`):

| Motor | `zoom` | `theme` |
| --- | --- | --- |
| PDF | escala da página (50%–300%) | sépia aplica filtro no papel |
| EPUB | tamanho do texto (75%–200% de 18 px); volta ao mesmo trecho após repaginar | cores do texto e links lidas das variáveis do tema |
| CBZ | ampliação com rolagem (100%–300%) | só o fundo |

## Cabeçalho

- **Selecionar página** (PDF/CBZ): campo "Ir para" + lista de páginas.
- **Sumário** (EPUB): lista de capítulos do TOC.
- **Configurações**: zoom (PDF/CBZ) ou tamanho do texto (EPUB) e tema
  (Noite, Sépia, Claro). Guardados no `localStorage` do navegador; o zoom
  é separado por formato.
- **Tela cheia**.

Teclado: ← → viram a página; + e − mudam o zoom; 0 volta a 100%. No EPUB,
o motor também escuta as setas dentro do iframe do livro.

## Temas

O `Reader` põe `data-reader-theme` no contêiner, e o `globals.css` redefine
as variáveis `--color-*` do tema dentro dele. Assim cabeçalho, painéis,
rodapé e o texto do EPUB mudam juntos, sem classes por tema.

## Progresso

`useReaderProgress` salva com debounce de 800 ms pela Server Action
`saveBookProgress`. O que ainda não foi salvo é enviado:

- ao esconder ou fechar a aba (`visibilitychange`/`pagehide`), por
  `navigator.sendBeacon` para `POST /api/reading-progress`;
- ao sair do leitor pela navegação do app, pela Server Action.

As duas entradas validam os dados com `parseReadingProgress`
(`lib/readingProgress.ts`).

## Detalhes

- EPUB: as *locations* (base do progresso em %) são geradas uma vez e
  guardadas no `localStorage` por arquivo.
- CBZ: imagens ordenadas por nome em ordem natural (2 antes de 10);
  arquivos de `__MACOSX/` e ocultos são ignorados (regras em
  `lib/comicFiles.ts`, compartilhadas com o upload).
- CBZ e EPUB: o arquivo baixado fica no Cache API do navegador
  (`lib/bookCache.ts`), até 8 livros / 400 MB, saindo os menos usados.
  A chave é o caminho no storage, então trocar o arquivo baixa de novo.
  O PDF não usa esse cache (o `react-pdf` carrega por partes).

## Upload de CBZ

No formulário, o CBZ pode ter até 400 MB. Antes do envio,
`lib/comicCompression.ts` reduz cada página a no máximo 2400 px no lado
maior e converte para WEBP (JPEG no Safari), com qualidade 0,8. Páginas
que não ficam menores mantêm o original. O resultado precisa caber em
50 MB (limite do bucket); senão o formulário pede para dividir o volume.
Valores em `lib/bookFiles.ts`.
