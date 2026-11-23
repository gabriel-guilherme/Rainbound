import DOMPurify, { type Config } from "dompurify";

/*
 * Limpeza do conteúdo do EPUB antes de ir para o iframe.
 *
 * O iframe do epub-ts roda com `allowScriptedContent` (sandbox com
 * allow-scripts + allow-same-origin): sem isso, o WebKit (Safari e todo
 * navegador do iPhone) não dispara os listeners que o leitor registra
 * dentro do livro, e o arraste para virar a página não funciona. Com
 * essa combinação o sandbox deixa de proteger, então tudo que pode
 * executar código no livro é removido aqui, com o DOMPurify, antes da
 * serialização (book.spine.hooks.content).
 */

const PURIFY_CONFIG: Config & { IN_PLACE: true } = {
  /* Limpa o documento do capítulo no lugar, sem serializar de novo. */
  IN_PLACE: true,
  /*
   * Sem PARSER_MEDIA_TYPE "application/xhtml+xml" de propósito: nesse
   * modo o DOMPurify compara os nomes sem passar para minúsculas, mas as
   * listas dele são minúsculas, e removia `viewBox`/`preserveAspectRatio`
   * (capa em SVG saía cortada) e tags como `linearGradient`. No modo
   * padrão ele só compara em minúsculas; o documento não é renomeado.
   */
  /*
   * Estrutura do documento e o que o epub-ts insere no <head> de cada
   * capítulo antes deste hook: <base> com a URL do capítulo (sobrescreve
   * o href de um <base> do livro), <link rel="canonical"> e
   * <meta name="dc.identifier">. Folhas de estilo do livro vêm por <link>.
   */
  ADD_TAGS: ["html", "head", "body", "title", "link", "meta", "base"],
  /* `epub:type` é usado no CSS de notas de rodapé e afins. */
  ADD_ATTR: ["rel", "content", "property", "epub:type", "xml:lang"],
  /* <meta http-equiv="refresh"> poderia navegar o iframe. */
  FORBID_ATTR: ["http-equiv"],
};

export function sanitizeEpubDocument(document: Document) {
  /* Folha XSLT poderia gerar scripts ao transformar o documento. */
  for (const node of Array.from(document.childNodes)) {
    if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const instruction = node as ProcessingInstruction;

      if (
        instruction.target === "xml-stylesheet" &&
        /xsl/i.test(instruction.data)
      ) {
        instruction.remove();
      }
    }
  }

  /*
   * Sem suporte, o DOMPurify devolve o conteúdo sem limpar; e se a
   * limpeza falhar, também. Nesses casos o capítulo sai vazio em vez
   * de ir sujo para um iframe que roda scripts.
   */
  try {
    if (!DOMPurify.isSupported) {
      throw new Error("DOMPurify não é suportado neste navegador.");
    }

    DOMPurify.sanitize(document.documentElement, PURIFY_CONFIG);
  } catch (error) {
    console.error("Não foi possível limpar o capítulo do EPUB:", error);

    const root = document.documentElement;

    while (root.firstChild) root.removeChild(root.firstChild);
  }
}
