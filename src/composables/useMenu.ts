import { nextTick, onMounted, onScopeDispose, ref, type Ref } from 'vue';
import { getMenuPlacement } from '@/utils/menuPlacement';

const useMenu = (
	root: Ref<HTMLElement | null>,
	trigger: Ref<HTMLButtonElement | null>,
	menu: Ref<HTMLElement | null>,
) => {
	const open = ref(false);
	const opensUp = ref(false);
	const maxHeight = ref<number>();
	let observer: ResizeObserver | undefined;
	let disposed = false;

	const position = () => {
		if (!open.value || !trigger.value || !menu.value || disposed) return;
		const node = menu.value;
		const viewport = window.visualViewport;
		const placement = getMenuPlacement(
			trigger.value.getBoundingClientRect(),
			node.scrollHeight + node.offsetHeight - node.clientHeight,
			{ top: viewport?.offsetTop ?? 0, height: viewport?.height ?? window.innerHeight },
		);
		opensUp.value = placement.up;
		maxHeight.value = placement.maxHeight;
	};

	const close = (restoreFocus = false) => {
		open.value = false;
		observer?.disconnect();
		if (restoreFocus) trigger.value?.focus();
	};

	const toggle = async () => {
		open.value = !open.value;
		if (!open.value) observer?.disconnect();
		if (open.value) {
			opensUp.value = false;
			maxHeight.value = undefined;
			await nextTick();
			if (!open.value || disposed) return;
			position();
			observer?.disconnect();
			if (menu.value) observer?.observe(menu.value);
			await nextTick();
			if (!open.value || disposed) return;
			menu.value
				?.querySelector<HTMLButtonElement>('button:not(:disabled)')
				?.focus({ preventScroll: true });
		}
	};

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
		observer = new ResizeObserver(position);
		window.addEventListener('resize', position);
		window.addEventListener('scroll', position, true);
		window.visualViewport?.addEventListener('resize', position);
		window.visualViewport?.addEventListener('scroll', position);
		document.addEventListener('pointerdown', outside);
		document.addEventListener('keydown', keyboard);
	});
	onScopeDispose(() => {
		disposed = true;
		observer?.disconnect();
		window.removeEventListener('resize', position);
		window.removeEventListener('scroll', position, true);
		window.visualViewport?.removeEventListener('resize', position);
		window.visualViewport?.removeEventListener('scroll', position);
		document.removeEventListener('pointerdown', outside);
		document.removeEventListener('keydown', keyboard);
	});

	return { open, opensUp, maxHeight, toggle, close };
};

export { useMenu };
