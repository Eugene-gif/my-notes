import { nextTick, ref } from 'vue';
import { expect, it } from 'vitest';
import { useMenu } from '@/composables/useMenu';
import { withSetup } from '../../composable';
it('moves keyboard focus, restores trigger focus and closes outside', async () => {
  const root = document.createElement('div'),
    trigger = document.createElement('button'),
    menu = document.createElement('div');
  menu.innerHTML = '<button>One</button><button disabled>Disabled</button><button>Two</button>';
  root.append(trigger, menu);
  document.body.append(root);
  const { result, wrapper } = withSetup(() => useMenu(ref(root), ref(trigger), ref(menu)));
  await result.toggle();
  expect(document.activeElement?.textContent).toBe('One');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
  expect(document.activeElement?.textContent).toBe('Two');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
  expect(document.activeElement?.textContent).toBe('One');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await nextTick();
  expect(result.open.value).toBe(false);
  expect(document.activeElement).toBe(trigger);
  await result.toggle();
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  expect(result.open.value).toBe(false);
  wrapper.unmount();
});
