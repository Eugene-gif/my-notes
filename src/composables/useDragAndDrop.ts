import { onMounted, onScopeDispose, type Ref } from 'vue';
import type { DropDestination, Entry, ParentId } from '@/types/notes';
import { findDropTarget } from '@/utils/dropTarget';
interface Options {
  getEntry: (id: ParentId) => Entry | undefined;
  getDragIds: (id: string) => string[];
  canDrop: (ids: string[], target: DropDestination) => boolean;
  onDrop: (ids: string[], target: DropDestination) => void;
  onNavigate: (id: ParentId) => void;
  onStatus: (message: string) => void;
}
interface Drag {
  id: string;
  ids: string[];
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  active: boolean;
  ghost?: HTMLElement;
}
export function useDragAndDrop(root: Ref<HTMLElement | null>, options: Options) {
  let drag: Drag | null = null;
  let target: DropDestination | null = null;
  let marker: HTMLElement | null = null;
  let frame: number | undefined;
  let hold: ReturnType<typeof setTimeout> | undefined;
  let hover: ReturnType<typeof setTimeout> | undefined;
  let suppressUntil = 0;
  let controller: AbortController | undefined;
  function clearTarget() {
    clearTimeout(hover);
    target?.element.classList.remove('is-drop-target', 'is-swap-target');
    marker?.remove();
    marker = null;
    target = null;
  }
  function finish() {
    clearTimeout(hold);
    clearTarget();
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = undefined;
    drag?.ghost?.remove();
    root.value
      ?.querySelectorAll('.is-drag-source')
      .forEach((card) => card.classList.remove('is-drag-source'));
    root.value?.classList.remove('is-dragging');
    const pointerId = drag?.pointerId;
    drag = null;
    if (pointerId !== undefined && root.value?.hasPointerCapture(pointerId))
      root.value.releasePointerCapture(pointerId);
  }
  function find(x: number, y: number) {
    const entry = drag && options.getEntry(drag.id);
    return root.value && drag && entry
      ? findDropTarget({
          root: root.value,
          ids: drag.ids,
          dragged: entry,
          x,
          y,
          getEntry: options.getEntry,
          canDrop: options.canDrop,
        })
      : null;
  }
  function updateTarget() {
    if (!drag) return;
    const next = find(drag.x, drag.y);
    if (
      next?.element !== target?.element ||
      next?.type !== target?.type ||
      next?.position !== target?.position
    ) {
      clearTarget();
      target = next;
      if (target?.type === 'order') {
        marker = document.createElement('div');
        marker.className = 'todo__drop-marker';
        marker.setAttribute('aria-hidden', 'true');
        document.body.append(marker);
      } else if (target?.type === 'swap') target.element.classList.add('is-swap-target');
      else if (target?.type === 'folder') target.element.classList.add('is-drop-target');
      if (target?.element.matches('.todo__path-button:not([aria-current="page"])')) {
        const id = target.parentId;
        hover = setTimeout(() => {
          clearTarget();
          options.onNavigate(id);
          requestAnimationFrame(() => {
            if (drag?.active) updateTarget();
          });
        }, 800);
      }
    }
    if (marker && target) {
      const box = target.element.getBoundingClientRect();
      marker.classList.toggle('is-vertical', !!target.horizontal);
      Object.assign(
        marker.style,
        target.horizontal
          ? {
              left: (target.position === 'before' ? box.left - 6 : box.right + 4) + 'px',
              top: box.top + 'px',
              width: '3px',
              height: box.height + 'px',
            }
          : {
              left: box.left + 'px',
              top: (target.position === 'before' ? box.top - 6 : box.bottom + 4) + 'px',
              width: box.width + 'px',
              height: '3px',
            },
      );
    }
  }
  function track() {
    if (!drag?.active || !drag.ghost) return;
    const edge = 64;
    const speed =
      drag.y < edge
        ? -Math.ceil((edge - drag.y) / 4)
        : drag.y > innerHeight - edge
          ? Math.ceil((drag.y - innerHeight + edge) / 4)
          : 0;
    if (speed) window.scrollBy(0, speed);
    Object.assign(drag.ghost.style, {
      left: Math.max(12, Math.min(drag.x + 14, innerWidth - drag.ghost.offsetWidth - 12)) + 'px',
      top: Math.max(12, Math.min(drag.y + 14, innerHeight - drag.ghost.offsetHeight - 12)) + 'px',
    });
    updateTarget();
    frame = requestAnimationFrame(track);
  }
  function start() {
    if (!drag || !root.value) return;
    drag.ids = options.getDragIds(drag.id);
    if (!drag.ids.length) {
      finish();
      return;
    }
    drag.active = true;
    root.value.setPointerCapture(drag.pointerId);
    window.getSelection()?.removeAllRanges();
    root.value.classList.add('is-dragging');
    root.value.querySelectorAll<HTMLElement>('.todo__item').forEach((card) => {
      if (drag?.ids.includes(card.dataset.id!)) card.classList.add('is-drag-source');
    });
    const entry = options.getEntry(drag.id);
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'todo__drag-preview';
    drag.ghost.textContent =
      drag.ids.length > 1
        ? 'Элементов: ' + drag.ids.length
        : entry?.type === 'task'
          ? entry.value
          : (entry?.name ?? '');
    drag.ghost.setAttribute('aria-hidden', 'true');
    document.body.append(drag.ghost);
    track();
  }
  onMounted(() => {
    const node = root.value;
    if (!node) return;
    controller = new AbortController();
    function listen<K extends keyof GlobalEventHandlersEventMap>(
      target: EventTarget,
      type: K,
      listener: (event: GlobalEventHandlersEventMap[K]) => void,
      options: AddEventListenerOptions = {},
    ) {
      target.addEventListener(type, listener as EventListener, {
        ...options,
        signal: controller!.signal,
      });
    }
    listen(node, 'pointerdown', (event) => {
      if (event.isPrimary && event.button === 0) suppressUntil = 0;
      if (!event.isPrimary || event.button !== 0 || drag || !(event.target instanceof Element))
        return;
      const card = event.target.closest<HTMLElement>('.todo__item');
      if (
        !card ||
        event.target.closest('input,textarea,.folder__options,.folder__menu,.task__expand')
      )
        return;
      const entry = options.getEntry(card.dataset.id ?? null);
      if (!entry) return;
      drag = {
        id: entry.id,
        ids: [entry.id],
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        active: false,
      };
      if (event.pointerType === 'touch') hold = setTimeout(start, 300);
    });
    listen(node, 'pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.x = event.clientX;
      drag.y = event.clientY;
      if (!drag.active) {
        if (
          Math.hypot(drag.x - drag.startX, drag.y - drag.startY) <
          (drag.pointerType === 'touch' ? 4 : 8)
        )
          return;
        if (drag.pointerType === 'touch') {
          finish();
          return;
        }
        start();
      }
      if (drag?.active) {
        event.preventDefault();
        updateTarget();
      }
    });
    listen(node, 'pointerup', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const active = drag.active,
        ids = drag.ids,
        destination = active ? find(event.clientX, event.clientY) : null;
      finish();
      if (active) {
        suppressUntil = performance.now() + 350;
        if (destination && destination.type !== 'navigate')
          options.onDrop(ids, {
            ...destination,
            dropPoint: { x: event.clientX, y: event.clientY },
          });
        else options.onStatus('Перенос отменён.');
      }
    });
    listen(
      node,
      'touchmove',
      (event) => {
        if (drag?.pointerType !== 'touch') return;
        const touch = event.touches[0];
        if (
          !drag.active &&
          touch &&
          Math.hypot(touch.clientX - drag.startX, touch.clientY - drag.startY) >= 4
        )
          finish();
        if (drag?.active && event.touches.length === 1 && event.cancelable) event.preventDefault();
      },
      { passive: false },
    );
    listen(
      node,
      'touchstart',
      (event) => {
        if (event.touches.length > 1) finish();
      },
      { passive: true },
    );
    listen(
      window,
      'scroll',
      () => {
        if (drag && !drag.active) finish();
      },
      { passive: true },
    );
    listen(node, 'pointercancel', finish);
    listen(node, 'lostpointercapture', (event) => {
      if (event.target === node && drag?.active && event.pointerId === drag.pointerId) finish();
    });
    listen(document, 'pointerup', () => {
      if (drag && !drag.active) finish();
    });
    listen(node, 'dragstart', (event) => event.preventDefault());
    listen(node, 'contextmenu', (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest('.todo__item') &&
        !event.target.closest('input,textarea')
      )
        event.preventDefault();
    });
    listen(
      node,
      'click',
      (event) => {
        if (performance.now() < suppressUntil) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
    listen(
      document,
      'keydown',
      (event) => {
        if (event.key === 'Escape' && drag) {
          event.preventDefault();
          event.stopImmediatePropagation();
          finish();
          suppressUntil = performance.now() + 350;
          options.onStatus('Перенос отменён.');
        }
      },
      { capture: true },
    );
  });
  onScopeDispose(() => {
    controller?.abort();
    finish();
  });
  return { cancel: finish };
}
