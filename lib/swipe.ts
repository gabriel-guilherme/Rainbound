/*
 * Gesto de arrastar para o lado (toque) para virar a página.
 * Usado pelo ReaderNavigation (PDF, CBZ), pelo carrossel do Início
 * (WidgetSection) e dentro do iframe do EPUB,
 * onde os eventos de toque não chegam ao documento do Reader.
 */

/* Distância mínima (px) e tempo máximo (ms) de um gesto válido. */
const MIN_DISTANCE = 50;
const MAX_DURATION = 800;

export type SwipeHandlers = {
  /* Arrastar para a direita: página anterior. */
  onPrevious: () => void;
  /* Arrastar para a esquerda: próxima página. */
  onNext: () => void;
};

type SwipeOptions = {
  /*
   * Elemento até onde procurar contêineres com rolagem horizontal
   * (zoom no PDF/CBZ). Se o conteúdo ainda puder rolar na direção do
   * gesto, o arraste rola em vez de virar a página.
   */
  scrollRoot?: Element;
};

/*
 * Sem `instanceof`: o EPUB fica num iframe, com outro `Document` e
 * outro `Element`, e `instanceof` com as classes daqui dá sempre false.
 */
function isElement(target: EventTarget | null): target is Element {
  return (target as Node | null)?.nodeType === 1;
}

function isDocument(target: Document | HTMLElement): target is Document {
  return target.nodeType === 9;
}

function canScrollFurther(
  target: EventTarget | null,
  root: Element,
  direction: "left" | "right",
) {
  let element = isElement(target) ? target : null;

  while (element && element !== root.parentElement) {
    const { overflowX } = getComputedStyle(element);
    const scrollable =
      (overflowX === "auto" || overflowX === "scroll") &&
      element.scrollWidth > element.clientWidth + 1;

    if (scrollable) {
      const atStart = element.scrollLeft <= 1;
      const atEnd =
        element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;

      if (direction === "left" ? !atEnd : !atStart) {
        return true;
      }
    }

    element = element.parentElement;
  }

  return false;
}

/*
 * Registra o gesto em `target` e devolve a função que o remove.
 * `getHandlers` é lido no fim do gesto, para usar sempre os atuais.
 */
export function attachSwipe(
  target: Document | HTMLElement,
  getHandlers: () => SwipeHandlers | null,
  { scrollRoot }: SwipeOptions = {},
) {
  let start: {
    x: number;
    y: number;
    time: number;
    /*
     * Se, no toque, o conteúdo ainda podia rolar para cada lado. Medido
     * no início: no fim do gesto a rolagem já pode ter chegado à borda
     * (fileira curta, arraste rápido), e o mesmo arraste rolaria e
     * viraria a página de uma vez.
     */
    canScroll: { left: boolean; right: boolean };
  } | null = null;

  const handleTouchStart = (event: Event) => {
    const { touches } = event as TouchEvent;

    /* Dois dedos = pinça de zoom, não é virar página. */
    if (touches.length !== 1) {
      start = null;
      return;
    }

    start = {
      x: touches[0].clientX,
      y: touches[0].clientY,
      time: Date.now(),
      canScroll: {
        left: Boolean(scrollRoot && canScrollFurther(event.target, scrollRoot, "left")),
        right: Boolean(scrollRoot && canScrollFurther(event.target, scrollRoot, "right")),
      },
    };
  };

  const handleTouchMove = (event: Event) => {
    if ((event as TouchEvent).touches.length > 1) start = null;
  };

  const handleTouchEnd = (event: Event) => {
    const touch = (event as TouchEvent).changedTouches[0];
    const gesture = start;

    start = null;

    if (!gesture || !touch) return;

    const dx = touch.clientX - gesture.x;
    const dy = touch.clientY - gesture.y;

    if (
      Date.now() - gesture.time > MAX_DURATION ||
      Math.abs(dx) < MIN_DISTANCE ||
      Math.abs(dx) < Math.abs(dy) * 1.5
    ) {
      return;
    }

    /* Texto sendo selecionado: o arraste é da seleção. */
    const selection = (
      isDocument(target) ? target : target.ownerDocument
    )?.getSelection?.();

    if (selection && !selection.isCollapsed) return;

    /* Dedo para a esquerda = conteúdo vai para a esquerda = avança. */
    const direction = dx < 0 ? "left" : "right";

    if (gesture.canScroll[direction]) {
      return;
    }

    const handlers = getHandlers();

    if (direction === "left") handlers?.onNext();
    else handlers?.onPrevious();
  };

  const handleTouchCancel = () => {
    start = null;
  };

  target.addEventListener("touchstart", handleTouchStart, { passive: true });
  target.addEventListener("touchmove", handleTouchMove, { passive: true });
  target.addEventListener("touchend", handleTouchEnd, { passive: true });
  target.addEventListener("touchcancel", handleTouchCancel, { passive: true });

  return () => {
    target.removeEventListener("touchstart", handleTouchStart);
    target.removeEventListener("touchmove", handleTouchMove);
    target.removeEventListener("touchend", handleTouchEnd);
    target.removeEventListener("touchcancel", handleTouchCancel);
  };
}
