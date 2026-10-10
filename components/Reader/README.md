# Sistema de Leitor - Rainbound

## Visão Geral

O leitor do Rainbound suporta múltiplos formatos de arquivo: **PDF**, **EPUB**, **CBZ** e **CBR**. Atualmente, apenas o PDF está totalmente funcional.

## Seleção Genérica de Páginas/Capítulos

### Dropdown de Seleção

O ícone **Summary** no header do leitor abre um dropdown que expande para baixo, mostrando uma lista de páginas/capítulos disponíveis.

#### Funcionamento:

1. **Clique no ícone Summary** - O dropdown expande para baixo
2. **Navegue na lista** - Páginas rápidas a cada 5 posições
3. **Digite um número** - Ou use o input para navegar direto
4. **Confirme** - O leitor navega para a posição selecionada

### Características:

- ✅ **Sem blur no fundo** - A lista expande naturalmente sobre o conteúdo
- ✅ **Lista expandível** - Dropdown que abre para baixo
- ✅ **Páginas rápidas** - Navegação rápida por grupos de 5 páginas
- ✅ **Input direto** - Digite qualquer número para navegar
- ✅ **Integrado ao header** - Faz parte do fluxo natural da interface

### Estrutura de Dados

O sistema utiliza o campo `locator` para armazenar informações de localização:

- **PDF**: `"pdf-page:X"` onde X é o número da página
- **EPUB**: CFI (Content Folder Identifier) do EPUB
- **Futuro**: `"chapter:X"` para navegação por capítulos

### Componentes Principais

#### 1. `DropdownPageSelection.tsx`
Dropdown genérico para seleção de posição. Funciona para ambos os formatos.

#### 2. `Reader.tsx`
Componente principal que:
- Detecta o formato do arquivo
- Gerencia o estado de leitura
- Abre o dropdown ao clicar no Summary
- Salva progresso automaticamente

#### 3. `PdfReader.tsx`
Leitor específico para PDFs usando `react-pdf`.

#### 4. `EpubReader.tsx`
Leitor específico para EPUBs usando `@likecoin/epub-ts`.

#### 5. `ChaptersSummary.tsx`
Componente para exibição do sumário de capítulos (EPUB).

### Planejamento Futuro

#### Implementação de Navegação por Capítulos (EPUB)

Para implementar a navegação por capítulos em EPUB:

1. **Atualizar o dropdown** para aceitar ambos tipos de localização
2. **Adicionar lógica de conversão** de capítulo para CFI
3. **Integrar com ChaptersSummary** para exibição do sumário
4. **Salvar progresso por capítulo** no banco de dados

#### Estrutura Sugerida:

```typescript
type LocatorType = "pdf-page" | "epub-cfi" | "chapter";

interface ReaderLocation {
  type: LocatorType;
  value: string | number;
}
```

### Utilitários

- `readerUtils.ts` - Funções auxiliares para processamento de localizadores
- `useReaderProgress.tsx` - Hook para salvamento automático de progresso
- `readerTypes.ts` - Tipos compartilhados entre componentes

## Arquitetura

```
Reader (main)
├── PdfReader (PDF)
├── EpubReader (EPUB)
├── DropdownPageSelection (genérico)
└── ChaptersSummary (futuro - EPUB)
```

O sistema é projetado para ser **extensível** e **manutenível**, com uma interface unificada que abstrai as diferenças entre os formatos.
