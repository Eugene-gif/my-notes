import { nextTick, onMounted, onScopeDispose, ref, type Ref } from 'vue';
export function useMenu(
  root: Ref<HTMLElement | null>,
  trigger: Ref<HTMLButtonElement | null>,
  menu: Ref<HTMLElement | null>,
) {
  const open = ref(false);
  function close(restoreFocus = false) {
    open.value = false;
    if (restoreFocus) trigger.value?.focus();
  }
  async function toggle() {
    open.value = !open.value;
    if (open.value) {
      await nextTick();
      menu.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    }
  }
  const outside = (event: PointerEvent) => {
    if (event.target instanceof Node && !root.value?.contains(event.target)) close();
  };
  const keyboard = (event: KeyboardEvent) => {
    if (!open.value) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    }
    if (event.key === 'Tab') close();
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [
      ...(menu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    items[
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    ]?.focus();
  };
  onMounted(() => {
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', keyboard);
  });
  onScopeDispose(() => {
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener('keydown', keyboard);
  });
  return { open, toggle, close };
}
