import { nextTick, onMounted, onScopeDispose, watch, type Ref } from 'vue';

const useDialog = (
	dialog: Ref<HTMLDialogElement | null>,
	open: Ref<boolean>,
	closed: () => void,
) => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;

	const sync = () => {
		if (disposed) return;
		clearTimeout(timer);
		const node = dialog.value;
		if (!node) return;
		if (open.value) {
			node.classList.remove('close');
			if (!node.open) node.showModal();
		} else if (node.open) {
			node.classList.add('close');
			const duration = getComputedStyle(node).animationDuration;
			const delay = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000) || 0;
			timer = setTimeout(() => {
				node.close();
			}, delay);
		}
	};

	const requestClose = () => closed();

	watch(open, () => nextTick(sync));
	onMounted(sync);
	onScopeDispose(() => {
		disposed = true;
		clearTimeout(timer);
		if (dialog.value?.open) dialog.value.close();
	});

	return { requestClose };
};

export { useDialog };
