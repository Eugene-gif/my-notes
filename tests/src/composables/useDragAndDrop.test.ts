import { ref } from 'vue';
import { expect, it, vi } from 'vitest';
import { useDragAndDrop } from '@/composables/useDragAndDrop';
import { fixture } from '../../fixtures';
import { withSetup } from '../../composable';
it('separates click and drag, drops on a target and disposes preview/listeners', () => {
  vi.useFakeTimers();
  const state = fixture(),
    root = document.createElement('div');
  root.innerHTML =
    '<li class="todo__item" data-id="task"></li><li class="todo__item" data-id="task2"></li>';
  document.body.append(root);
  const card = root.children[0],
    other = root.children[1];
  vi.spyOn(other, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 200,
    bottom: 80,
    width: 200,
    height: 80,
  } as DOMRect);
  vi.spyOn(document, 'elementFromPoint').mockReturnValue(other);
  const onDrop = vi.fn(),
    onStatus = vi.fn();
  const { wrapper } = withSetup(() =>
    useDragAndDrop(ref(root), {
      getEntry: (id) => state.tasks.find((entry) => entry.id === id),
      getDragIds: (id) => [id],
      canDrop: () => true,
      onDrop,
      onNavigate: vi.fn(),
      onStatus,
    }),
  );
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
  root.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 30, clientY: 40 }));
  expect(document.querySelector('.todo__drag-preview')).not.toBeNull();
  root.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 100, clientY: 40 }));
  expect(onDrop).toHaveBeenCalledWith(['task'], expect.objectContaining({ type: 'swap' }));
  expect(document.querySelector('.todo__drag-preview')).toBeNull();
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
  root.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 30, clientY: 40 }));
  wrapper.unmount();
  expect(document.querySelector('.todo__drag-preview')).toBeNull();
});
it('keeps touch swipes native before hold, starts after hold and cancels with Escape', () => {
  vi.useFakeTimers();
  const root = document.createElement('div');
  root.innerHTML = '<li class="todo__item" data-id="task"></li>';
  document.body.append(root);
  const status = vi.fn();
  const { wrapper } = withSetup(() =>
    useDragAndDrop(ref(root), {
      getEntry: () => fixture().tasks[0],
      getDragIds: (id) => [id],
      canDrop: () => false,
      onDrop: vi.fn(),
      onNavigate: vi.fn(),
      onStatus: status,
    }),
  );
  const card = root.children[0];
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
  root.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', clientY: 20 }),
  );
  vi.advanceTimersByTime(300);
  expect(document.querySelector('.todo__drag-preview')).toBeNull();
  card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
  vi.advanceTimersByTime(300);
  expect(document.querySelector('.todo__drag-preview')).not.toBeNull();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(status).toHaveBeenCalled();
  expect(document.querySelector('.todo__drag-preview')).toBeNull();
  wrapper.unmount();
});
