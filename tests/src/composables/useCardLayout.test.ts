import { nextTick, ref } from 'vue';
import { expect, it, vi } from 'vitest';
import { useCardLayout } from '@/composables/useCardLayout';
import { TestResizeObserver } from '../../setup';
import { withSetup } from '../../composable';

it('assigns column and span metrics and cancels scheduled work on disposal', async () => {
	vi.useFakeTimers();
	const list = document.createElement('ul');
	list.style.setProperty('--columns', '2');
	list.style.columnGap = '10px';
	list.innerHTML = '<li></li><li></li><li></li>';
	document.body.append(list);
	[...list.children].forEach((card) =>
		vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({ height: 100 } as DOMRect),
	);
	const version = ref(0);
	const { result, wrapper } = withSetup(() => useCardLayout(ref(list), version));
	await nextTick();
	vi.advanceTimersByTime(20);
	expect((list.children[2] as HTMLElement).style.getPropertyValue('--card-column')).toBe('1');
	expect((list.children[0] as HTMLElement).style.getPropertyValue('--card-row-span')).toBe('110');
	version.value++;
	await nextTick();
	await nextTick();
	result.queue();
	wrapper.unmount();
	expect(TestResizeObserver.instances[0].disconnect).toHaveBeenCalled();
});
