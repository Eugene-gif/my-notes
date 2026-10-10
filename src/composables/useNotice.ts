import { nextTick, onMounted, onScopeDispose, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNoticesStore } from '@/store/noticesStore';

const useNotice = () => {
	const store = useNoticesStore();
	const { current } = storeToRefs(store);
	const host = ref<HTMLElement | null>(null);
	const target = ref<Element | null>(null);
	const closing = ref(false);
	const entering = ref(true);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let removalTimer: ReturnType<typeof setTimeout> | undefined;
	let observer: MutationObserver | undefined;
	let previousFocus: Element | null = null;
	let visibleMessageId: number | undefined;
	let displayed = false;
	let disposed = false;

	const clear = () => {
		clearTimeout(timer);
		clearTimeout(removalTimer);
	};

	const display = async () => {
		await nextTick();
		if (disposed || !current.value) return;
		const dialog = [...document.querySelectorAll('dialog[open]')].at(-1);
		if (dialog?.classList.contains('close')) return;
		const destination = dialog ?? document.body;
		if (target.value !== destination) {
			if (displayed) entering.value = false;
			target.value = destination;
		}
		await nextTick();
		if (disposed || !current.value || !host.value) return;
		const activeDialog = [...document.querySelectorAll('dialog[open]')].at(-1);
		if (
			activeDialog?.classList.contains('close') ||
			(activeDialog ?? document.body) !== destination
		)
			return;
		if (!host.value.matches(':popover-open')) host.value.showPopover?.();
		displayed = true;
		if (visibleMessageId !== current.value.id) {
			visibleMessageId = current.value.id;
			if (current.value.duration) timer = setTimeout(close, current.value.duration);
		}
	};

	const close = () => {
		if (!current.value || closing.value) return;
		clear();
		closing.value = true;
		if (
			host.value?.contains(document.activeElement) &&
			previousFocus instanceof HTMLElement &&
			previousFocus.isConnected
		)
			previousFocus.focus({ preventScroll: true });
		removalTimer = setTimeout(store.close, 160);
	};

	watch(
		current,
		(value) => {
			clear();
			closing.value = false;
			if (!value) {
				displayed = false;
				return;
			}
			previousFocus = document.activeElement;
			if (!host.value?.matches(':popover-open')) entering.value = true;
			void display();
		},
		{ flush: 'post' },
	);

	onMounted(() => {
		observer = new MutationObserver((records) => {
			if (!current.value) return;
			const dialogChanged = records.some((record) =>
				record.type === 'attributes'
					? record.target instanceof HTMLDialogElement
					: [...record.addedNodes, ...record.removedNodes].some(
						(node) =>
							node instanceof Element && (node.matches('dialog') || node.querySelector('dialog')),
					),
			);
			if (dialogChanged) void display();
		});

		observer.observe(document.documentElement, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['open', 'class'],
		});
		if (current.value) void display();
	});

	onScopeDispose(() => {
		disposed = true;
		clear();
		observer?.disconnect();
	});

	return { current, host, target, closing, entering, close };
};

export { useNotice };
