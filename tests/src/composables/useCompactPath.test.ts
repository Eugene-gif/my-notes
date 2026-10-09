import { nextTick, ref } from 'vue';
import { expect, it, vi } from 'vitest';
import { useCompactPath } from '@/composables/useCompactPath';
import { TestResizeObserver } from '../../setup';
import { withSetup } from '../../composable';
it('collapses paths only when the full path overflows', async () => {
  const nav = document.createElement('nav');
  nav.innerHTML = '<button class="todo__path-button"></button>'.repeat(3);
  document.body.append(nav);
  let width = 120;
  Object.defineProperty(nav, 'clientWidth', { get: () => width });
  [...nav.children].forEach((item) =>
    vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({ width: 100 } as DOMRect),
  );
  const { result, wrapper } = withSetup(() => useCompactPath(ref(nav), ref(0)));
  await nextTick();
  expect(result.compact.value).toBe(true);
  width = 500;
  TestResizeObserver.instances[0].emit(nav, width);
  await nextTick();
  expect(result.compact.value).toBe(false);
  wrapper.unmount();
  expect(TestResizeObserver.instances[0].disconnect).toHaveBeenCalled();
});
