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
Reader.tsx            junta as peças: cabeçalho, conteúdo, rodapé e modo imersivo
├── NavigatorPanel    painel de navegação: seletor de página (PDF/CBZ) ou sumário (EPUB)
├── BookmarksPanel    painel "Marcadores" ("Onde parei" + marcadores com nome)
├── SettingsPanel     painel "Configurações" (zoom, tema, mostrar hora/sessão)
│   └── SettingSwitch chave liga/desliga das Configurações
├── ReaderFooter      rodapé: hora | página atual | Sessão
├── usePageTurn       virar página com animação (turnPage estável para o motor)
├── useReaderKeyboard atalhos ← → + − 0 Esc
├── useBookmarks      lista de marcadores e criar/renomear/apagar
├── useReaderProgress salvamento de progresso (só avança; debounce + ao sair/fechar)
├── useReaderSettings zoom, tema e o que mostrar (localStorage, por navegador)
├── ReaderNavigation  setas laterais + arraste para o lado (lib/swipe.ts)
├── PdfReader         ┐
├── EpubReader        ├─ motores: implementam ReaderEngineProps
├── ComicReader       ┘
└── FileError         tela de erro dos motores (com "Tentar de novo")
```

Cada motor recebe `ReaderEngineProps` (`readerTypes.ts`) e:

1. chama `onReady(controller)` quando o arquivo carrega, entregando um
   `ReaderController` (`previous`, `next` e `goToPage` ou `goToChapter`);
2. chama `onPageChange(pageInfo)` a cada mudança de posição (atualiza a UI;
   `atStart`/`atEnd` desabilitam as setas e as viradas);
3. chama `onProgressChange(progress)` quando a posição muda de verdade
   (o `Reader` salva com debounce via `useReaderProgress`);
4. (EPUB) chama `onContentsChange(chapters)` com o sumário.

Os motores guardam esses callbacks em um ref, para que o `Reader` possa
re-renderizar sem recarregar o livro.

O rodapé e os marcadores mostram "Página X de Y · Z%" nos três formatos.
A porcentagem conta a página atual como lida (`calculateProgress`), então a
última página dá 100%. No EPUB, "página" é uma posição de ~1024 caracteres
(`book.locations`): não muda com o tamanho do texto nem com a tela, mas não
é a página exibida. Na última tela (`atEnd`), conta como a última posição.

Além disso, todo motor recebe `zoom` e `theme` (`ReaderDisplayProps`):

| Motor | `zoom` | `theme` |
| --- | --- | --- |
| PDF | escala da página (50%–300%) | sépia aplica filtro no papel |
| EPUB | tamanho do texto (75%–200% de 18 px); volta ao mesmo trecho após repaginar | fundo, texto e links lidos das variáveis do tema; sobrepõe cores e fundos do CSS do livro e acerta o `color-scheme` do iframe (senão ele fica branco) |
| CBZ | ampliação com rolagem (100%–300%) | só o fundo |

## Cabeçalho

- **Selecionar página** (PDF/CBZ): campo "Ir para" + lista de páginas.
- **Sumário** (EPUB): o TOC inteiro, com subitens indentados (partes →
  capítulos).

No EPUB, o título do cabeçalho é o do capítulo atual
(`buildTocEntries` + `findCurrentChapter` em `readerUtils.ts`): a última
entrada do sumário que começa até a última posição visível. Seções sem
entrada própria herdam o capítulo anterior; entradas com âncora (`#id`,
vários capítulos num arquivo) só contam depois que a âncora aparece. Antes
do primeiro capítulo (capa), mostra o título do livro.
- **Configurações**: zoom (PDF/CBZ) ou tamanho do texto (EPUB), tema
  (Noite, Sépia, Claro) e "Mostrar no leitor" (relógio; cronômetro e
  timer). Guardados no `localStorage` do navegador; o zoom é separado por
  formato.
- **Tela cheia**: a partir de `sm`, tela cheia do navegador
  (`FullScreenButton`). No celular, o mesmo ícone liga o **modo imersivo**:
  cabeçalho, rodapé e setas somem e o conteúdo ocupa a tela toda
  (respeitando o entalhe/barra de gestos). Um botão discreto no canto
  superior direito, ou Esc, volta ao normal.

Teclado: ← → viram a página; + e − mudam o zoom; 0 volta a 100%. No EPUB,
o motor repassa ao `Reader` as teclas pressionadas dentro do iframe do livro.

Toque: arrastar para a esquerda avança e para a direita volta
(`attachSwipe` em `lib/swipe.ts`, também usado no carrossel do Início). PDF/CBZ registram o gesto no
`ReaderNavigation`; o EPUB registra dentro do iframe de cada seção, que não
repassa os toques. Com zoom, se a página ainda pode rolar na direção do
arraste, ela rola em vez de virar; pinça (dois dedos) e seleção de texto
são ignoradas.

**EPUB no iPhone:** o epub-ts renderiza cada seção num iframe com
`sandbox`. Sem `allow-scripts`, o WebKit (Safari e todo navegador do iOS)
não dispara os listeners que o leitor registra dentro do livro, e o
arraste/teclado não funcionam. Por isso a rendition usa
`allowScriptedContent: true`, e `epubSanitize.ts` limpa cada seção com o
**DOMPurify** (`IN_PLACE`; sem o modo XHTML, que removia `viewBox` do SVG), via `book.spine.hooks.content`,
antes de serializar. Ficam só tags e atributos seguros, mais o que o
epub-ts insere no `<head>` (`<base>` com a URL do capítulo, `<link
rel="canonical">`, `<meta name="dc.identifier">`), `<link>` das folhas de
estilo e `epub:type`; `http-equiv` e folhas XSLT saem. Se o DOMPurify não
for suportado ou falhar, o capítulo sai vazio. Com scripts liberados o
sandbox não protege mais: qualquer mudança aqui precisa manter essa limpeza.

Ao virar a página (setas, teclado ou arraste), a página nova entra
deslizando do lado da direção (Web Animations API, 280 ms). O `Reader`
guarda o pedido e só anima quando o motor avisa a nova posição em
`onPageChange`; o EPUB pede a virada por `onTurnPage` para passar pelo
mesmo caminho. Saltos pelo seletor de página/sumário não animam, e
`prefers-reduced-motion` desliga a animação.

## Rodapé: hora e sessão de leitura

O rodapé tem três colunas: hora (`CurrentTime`) | página atual | botão
**Sessão** (`SessionButton`). As duas laterais somem pelas Configurações.

A sessão (`components/ReadingSession/`) é um cronômetro ou um timer
(atalhos de 15/25/45/60 min, ou clicar no número grande do timer e digitar
os minutos, de 1 a 180). O
painel abre para cima a partir do botão; no celular, como uma folha logo
acima do rodapé. Quando o timer acaba, aparece um aviso no topo
(`SessionFinishedNotice`, sem som) com "Mais 5 min" e "Fechar".

O estado fica no `localStorage` (`sessionState.ts`; cálculo e formatação
dos tempos em `sessionTime.ts`, tique de 1 s em `lib/useNow.ts`, ações no hook
`useReadingSession`), compartilhado com o
widget "Sessão" da home: começou no leitor, continua contando lá. Guarda
horários (quando começou / quando acaba), não contagens, então o tempo
segue certo com a aba fechada. Nada vai para o banco.

## Temas

O `Reader` põe `data-reader-theme` no contêiner, e o `globals.css` redefine
as variáveis `--color-*` do tema dentro dele. Assim cabeçalho, painéis,
rodapé e o texto do EPUB mudam juntos, sem classes por tema.

## Progresso

O progresso salvo **só avança**: voltar páginas para reler não muda o que
está salvo. A regra fica no servidor (`saveReadingProgress`, um
`updateMany` com `currentPosition < nova`) e é repetida no cliente
(`isAhead`) para nem enviar o que seria ignorado. Se o `totalPositions`
mudou (arquivo trocado), grava normalmente.

`useReaderProgress` salva com debounce de 800 ms pela Server Action
`saveBookProgress`. O que ainda não foi salvo é enviado:

- ao esconder ou fechar a aba (`visibilitychange`/`pagehide`), por
  `navigator.sendBeacon` para `POST /api/reading-progress`;
- ao sair do leitor pela navegação do app, pela Server Action.

As duas entradas validam os dados com `parseReadingProgress`
(`lib/readingProgress.ts`).

Quando o progresso avança, o status do livro acompanha
(`updateStatusFromProgress`, mesma regra do registro manual em
`statusChangeForProgress`): o primeiro avanço leva "Quero ler" ou
"Abandonado" para **Lendo**, e chegar a 100% leva a **Lido** (com
`startedAt`/`finishedAt`). O status nunca volta: reler um livro lido, ou
"Salvar aqui" mais para trás, não o tira de "Lido".

## Marcadores

Botão de marcador no cabeçalho (`BookmarksPanel`):

- **Onde parei** (padrão): é o `ReadingProgress`. "Ir" pula para lá;
  **Salvar aqui** grava a página atual mesmo para trás
  (`setBookProgress` → `setReadingProgress`, um upsert sem a regra de
  avançar).
- **Marcadores com nome** (modelo `Bookmark`): criados na posição atual
  (nome sugerido: página ou capítulo), com ir, editar o nome na própria
  linha (`renameBookmark`; Enter salva, Esc cancela) e apagar. Guardam o
  mesmo locator do progresso; para mudar a posição, crie outro.

Para ir até um marcador, todo motor implementa `goToLocator` no
`ReaderController`. O EPUB entrega ao Reader a posição restaurada ao
abrir (depois da restauração), para "Salvar aqui" e "Marcar" funcionarem
antes da primeira virada de página.

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
