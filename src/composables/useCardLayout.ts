import { nextTick, onMounted, onScopeDispose, watch, type Ref } from 'vue';
export function useCardLayout(list: Ref<HTMLElement | null>, version: Ref<unknown>) {
  let observer: ResizeObserver | undefined;
  let frame: number | undefined;
  let disposed = false;
  const layout = () => {
    frame = undefined;
    const node = list.value;
    if (!node) return;
    const css = getComputedStyle(node);
    const columns = Number(css.getPropertyValue('--columns')) || 1;
    const gap = parseFloat(css.columnGap) || 10;
    [...node.children].forEach((card, index) => {
      if (!(card instanceof HTMLElement)) return;
      card.style.setProperty('--card-column', String((index % columns) + 1));
      card.style.setProperty(
        '--card-row-span',
        String(Math.ceil(card.getBoundingClientRect().height + gap)),
      );
    });
  };
  const queue = () => {
    if (frame === undefined) frame = requestAnimationFrame(layout);
  };
  const observeCards = async () => {
    await nextTick();
    if (disposed) return;
    observer?.disconnect();
    if (list.value) {
      observer?.observe(list.value);
      [...list.value.children].forEach((card) => observer?.observe(card));
    }
    queue();
  };
  watch(version, observeCards, { flush: 'post' });
  onMounted(() => {
    observer = new ResizeObserver(queue);
    void observeCards();
  });
  onScopeDispose(() => {
    disposed = true;
    observer?.disconnect();
    if (frame !== undefined) cancelAnimationFrame(frame);
  });
  return { queue };
}
