import { ref } from 'vue';
import { afterEach, expect, it, vi } from 'vitest';
import { useTaskExpansion } from '@/composables/useTaskExpansion';
import { withSetup } from '../../composable';

afterEach(() => vi.restoreAllMocks());

const setup = () => {
	const card = document.createElement('li');
	card.style.setProperty('--task-expand-duration', '0.3s');
	document.body.append(card);
	const animations: { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }[] = [];
	const animate = vi.fn(() => {
		const animation = { cancel: vi.fn(), onfinish: null as (() => void) | null };
		animations.push(animation);
		return animation as unknown as Animation;
	});
	card.animate = animate;
	const { result, wrapper } = withSetup(() => useTaskExpansion(ref(card)));
	let renderedHeight: number | undefined;
	vi.spyOn(card, 'getBoundingClientRect').mockImplementation(
		() => ({ height: renderedHeight ?? (result.expanded.value ? 240 : 64) }) as DOMRect,
	);
	return {
		result,
		wrapper,
		animate,
		animations,
		card,
		setHeight: (height: number | undefined) => {
			renderedHeight = height;
		},
	};
};

it('animates expansion and collapse and releases the explicit height after finishing', async () => {
	const { result, animate, animations } = setup();
	await result.toggle();
	expect(result.expanded.value).toBe(true);
	expect(result.animating.value).toBe(true);
	expect(animate).toHaveBeenLastCalledWith(
		[{ height: '64px' }, { height: '240px' }],
		expect.objectContaining({ duration: 300 }),
	);
	animations[0].onfinish?.();
	expect(result.animating.value).toBe(false);
	expect(animations[0].cancel).toHaveBeenCalled();
	await result.toggle();
	expect(result.expanded.value).toBe(false);
	expect(animate).toHaveBeenLastCalledWith(
		[{ height: '240px' }, { height: '64px' }],
		expect.any(Object),
	);
});

it('reverses from the rendered height and cancels pending work on disposal', async () => {
	const { result, animate, animations, setHeight, wrapper } = setup();
	await result.toggle();
	setHeight(120);
	const reversal = result.toggle();
	setHeight(undefined);
	await reversal;
	expect(animations[0].cancel).toHaveBeenCalled();
	expect(animate).toHaveBeenLastCalledWith(
		[{ height: '120px' }, { height: '64px' }],
		expect.any(Object),
	);
	animations[0].onfinish?.();
	expect(result.animating.value).toBe(true);
	wrapper.unmount();
	expect(animations[1].cancel).toHaveBeenCalled();
	expect(result.animating.value).toBe(false);
});

it('avoids animations for rapid toggles, disposal before rendering, and reduced motion', async () => {
	const { result, animate, wrapper, setHeight } = setup();
	setHeight(64);
	await Promise.all([result.toggle(), result.toggle()]);
	setHeight(undefined);
	expect(result.expanded.value).toBe(false);
	expect(animate).not.toHaveBeenCalled();
	const pending = result.toggle();
	wrapper.unmount();
	await pending;
	expect(animate).not.toHaveBeenCalled();
	const reduced = setup();
	Object.defineProperty(window, 'matchMedia', {
		configurable: true,
		value: vi.fn(() => ({ matches: true })),
	});
	try {
		await reduced.result.toggle();
		expect(reduced.result.expanded.value).toBe(true);
		expect(reduced.animate).not.toHaveBeenCalled();
	} finally {
		delete (window as Partial<Window>).matchMedia;
	}
});

it('still toggles when the animation API is unavailable', async () => {
	const { result, card } = setup();
	delete (card as Partial<HTMLElement>).animate;
	await result.toggle();
	expect(result.expanded.value).toBe(true);
	expect(result.animating.value).toBe(false);
});
