import { nextTick, ref } from 'vue';
import { expect, it, vi } from 'vitest';
import { useMenu } from '@/composables/useMenu';
import { withSetup } from '../../composable';
import { TestResizeObserver } from '../../setup';

it('moves keyboard focus, restores trigger focus and closes outside', async () => {
	const root = document.createElement('div');
	const trigger = document.createElement('button');
	const menu = document.createElement('div');
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

it('flips near the bottom, repositions on resize and releases observers on close', async () => {
	const root = document.createElement('div');
	const trigger = document.createElement('button');
	const menu = document.createElement('div');
	menu.innerHTML = '<button>Action</button>';
	root.append(trigger, menu);
	document.body.append(root);
	Object.defineProperties(menu, {
		scrollHeight: { value: 184 },
		offsetHeight: { value: 184 },
		clientHeight: { value: 184 },
	});
	const bounds = vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue({
		top: window.innerHeight - 80,
		bottom: window.innerHeight - 40,
	} as DOMRect);
	const { result, wrapper } = withSetup(() => useMenu(ref(root), ref(trigger), ref(menu)));
	await result.toggle();
	expect(result.opensUp.value).toBe(true);
	expect(result.maxHeight.value).toBe(window.innerHeight - 100);
	expect(TestResizeObserver.instances[0].observe).toHaveBeenCalledWith(menu);
	bounds.mockReturnValue({ top: 100, bottom: 140 } as DOMRect);
	window.dispatchEvent(new Event('resize'));
	expect(result.opensUp.value).toBe(false);
	expect(result.maxHeight.value).toBe(window.innerHeight - 160);
	result.close();
	expect(TestResizeObserver.instances[0].disconnect).toHaveBeenCalled();
	wrapper.unmount();
});
