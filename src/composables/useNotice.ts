import { nextTick, onMounted, onScopeDispose, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNoticesStore } from '@/store/noticesStore';

const useNotice = () => {
	const store = useNoticesStore();
	const { current } = storeToRefs(store);
	const host = ref<HTMLElement | null>(null);
	const target = ref<Element | null>(null);
	const closing = ref(false);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let removalTimer: ReturnType<typeof setTimeout> | undefined;
	let observer: MutationObserver | undefined;
	let previousFocus: Element | null = null;

	const clear = () => {
		clearTimeout(timer);
		clearTimeout(removalTimer);
	};

	const display = async () => {
		await nextTick();
		if (current.value && host.value && !host.value.matches(':popover-open'))
			host.value.showPopover?.();
	};

	const mount = () => {
		const destination = [...document.querySelectorAll('dialog[open]')].at(-1) ?? document.body;
		if (target.value !== destination) {
			target.value = destination;
			void display();
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
			if (!value) return;
			previousFocus = document.activeElement;
			mount();
			void display();
			if (value.duration) timer = setTimeout(close, value.duration);
		},
		{ flush: 'post' },
	);
	onMounted(() => {
		mount();
		observer = new MutationObserver(() => {
			if (current.value) mount();
		});
		observer.observe(document.documentElement, {
			subtree: true,
			attributes: true,
			attributeFilter: ['open'],
		});
		if (current.value) {
			void display();
			if (current.value.duration) timer = setTimeout(close, current.value.duration);
		}
	});
	onScopeDispose(() => {
		clear();
		observer?.disconnect();
	});

	return { current, host, target, closing, close };
};

export { useNotice };
