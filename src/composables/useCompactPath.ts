import { nextTick, onMounted, onScopeDispose, ref, watch, type Ref } from 'vue';

const useCompactPath = (nav: Ref<HTMLElement | null>, version: Ref<unknown>) => {
	const compact = ref(false);
	let observer: ResizeObserver | undefined;
	let width = -1;
	let generation = 0;

	const measure = async () => {
		const ticket = ++generation;
		compact.value = false;
		await nextTick();
		if (ticket !== generation || !nav.value) return;
		const links = nav.value.querySelectorAll('.todo__path-button');
		const total = [...nav.value.children].reduce((sum, node) => {
			const name = node.querySelector('.todo__path-name');

			return (
				sum +
				node.getBoundingClientRect().width +
				(name ? Math.max(0, name.scrollWidth - name.clientWidth) : 0) +
				4
			);
		}, -4);
		compact.value = links.length >= 3 && total > nav.value.clientWidth;
	};

	watch(version, measure, { flush: 'post' });
	onMounted(() => {
		observer = new ResizeObserver((entries) => {
			const next = entries[0]?.contentRect.width;
			if (next !== undefined && next !== width) {
				width = next;
				void measure();
			}
		});
		if (nav.value) observer.observe(nav.value);
		void measure();
	});
	onScopeDispose(() => {
		generation++;
		observer?.disconnect();
	});

	return { compact };
};

export { useCompactPath };
