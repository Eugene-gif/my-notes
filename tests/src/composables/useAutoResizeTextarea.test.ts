import { nextTick, ref } from 'vue';
import { expect, it, vi } from 'vitest';
import { useAutoResizeTextarea } from '@/composables/useAutoResizeTextarea';
import { TestResizeObserver } from '../../setup';
import { withSetup } from '../../composable';

it('grows and shrinks textareas within bounds and disconnects resources', async () => {
	const area = document.createElement('textarea');
	area.style.minHeight = '180px';
	area.style.maxHeight = '300px';
	document.body.append(area);
	vi.spyOn(area, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
	let height = 400;
	Object.defineProperty(area, 'scrollHeight', { get: () => height });
	const value = ref('text');
	const { result, wrapper } = withSetup(() => useAutoResizeTextarea(ref(area), value));
	expect(area.style.height).toBe('300px');
	expect(area.style.overflowY).toBe('auto');
	height = 40;
	value.value = 'short';
	await nextTick();
	await nextTick();
	expect(area.style.height).toBe('180px');
	expect(area.style.overflowY).toBe('hidden');
	result.resize();
	const observer = TestResizeObserver.instances[0];
	observer.emit(area);
	wrapper.unmount();
	expect(observer.disconnect).toHaveBeenCalled();
});

it('defers width-triggered layout changes and cancels pending work on disposal', () => {
	const area = document.createElement('textarea');
	area.style.minHeight = '80px';
	area.style.maxHeight = '180px';
	document.body.append(area);
	vi.spyOn(area, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
	let height = 40;
	Object.defineProperty(area, 'scrollHeight', { get: () => height });
	let callback: FrameRequestCallback | undefined;
	const request = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((next) => {
		callback = next;
		return 1;
	});
	const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => {});
	const { wrapper } = withSetup(() => useAutoResizeTextarea(ref(area), ref('text')));
	const observer = TestResizeObserver.instances[0];
	height = 400;
	observer.emit(area);
	expect(area.style.height).toBe('80px');
	callback!(0);
	expect(area.style.height).toBe('180px');
	expect(area.style.overflowY).toBe('auto');
	observer.emit(area);
	expect(request).toHaveBeenCalledTimes(1);
	observer.emit(area, 200);
	wrapper.unmount();
	expect(cancel).toHaveBeenCalledWith(1);
});
