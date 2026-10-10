import { nextTick, onScopeDispose, ref, type Ref } from 'vue';

const useTaskExpansion = (card: Ref<HTMLElement | null>) => {
	const expanded = ref(false);
	const animating = ref(false);
	let animation: Animation | undefined;
	let revision = 0;

	const cancel = () => {
		animation?.cancel();
		animation = undefined;
		animating.value = false;
	};

	const toggle = async () => {
		const node = card.value;
		const height = node?.getBoundingClientRect().height;
		const current = ++revision;
		cancel();
		expanded.value = !expanded.value;
		await nextTick();
		if (
			current !== revision ||
			!node ||
			height === undefined ||
			!node.animate ||
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
		)
			return;

		const target = node.getBoundingClientRect().height;
		if (height === target) return;
		const duration = getComputedStyle(node).getPropertyValue('--task-expand-duration').trim();
		const milliseconds = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
		animating.value = true;
		await nextTick();
		if (current !== revision) return;
		animation = node.animate([{ height: `${height}px` }, { height: `${target}px` }], {
			duration: Number.isFinite(milliseconds) ? milliseconds : 300,
			easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
			fill: 'both',
		});
		animation.onfinish = () => {
			if (current === revision) cancel();
		};
	};

	onScopeDispose(() => {
		revision++;
		cancel();
	});

	return { expanded, animating, toggle };
};

export { useTaskExpansion };
