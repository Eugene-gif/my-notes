import {
	computed,
	onMounted,
	onScopeDispose,
	ref,
	shallowReactive,
	shallowRef,
	type Ref,
} from 'vue';
import type { InstallPromptEvent, PwaController } from '@/types/pwa';

export const usePwa = (options: { enabled?: boolean; reload?: () => void } = {}): PwaController => {
	const offlineReady = ref(false);
	const needRefresh = ref(false);
	const dismissed = ref(false);
	const installed = ref(false);
	const installing = ref(false);
	const updating = ref(false);
	const showInstallHelp = ref(false);
	const error = ref('');
	const updateBlocked = ref(false);
	const installPrompt = shallowRef<InstallPromptEvent | null>(null);
	const drafts = shallowReactive(new Set<Ref<boolean>>());
	const hasUnsavedChanges = computed(() => [...drafts].some((dirty) => dirty.value));
	const cleanup: (() => void)[] = [];
	let registration: ServiceWorkerRegistration | undefined;
	let disposed = false;
	let hadController = false;
	let updateTimer: ReturnType<typeof setTimeout> | undefined;
	let lastCheck = 0;

	const listen = (target: EventTarget, name: string, handler: EventListener) => {
		target.addEventListener(name, handler);
		cleanup.push(() => target.removeEventListener(name, handler));
	};
	const trackDraft = (dirty: Ref<boolean>) => {
		drafts.add(dirty);
		return () => {
			drafts.delete(dirty);
		};
	};
	const markUpdate = () => {
		needRefresh.value = true;
		dismissed.value = false;
	};
	const reload = () => {
		clearTimeout(updateTimer);
		updating.value = false;
		if (hasUnsavedChanges.value) {
			updateBlocked.value = true;
			markUpdate();
			return;
		}
		(options.reload ?? (() => window.location.reload()))();
	};
	const update = () => {
		if (updating.value || !needRefresh.value) return;
		updateBlocked.value = hasUnsavedChanges.value;
		if (updateBlocked.value) return;
		error.value = '';
		const waiting = registration?.waiting;
		if (!waiting) {
			reload();
			return;
		}
		updating.value = true;
		updateTimer = setTimeout(() => {
			updating.value = false;
			error.value = 'Обновление не завершилось. Попробуйте ещё раз.';
		}, 10000);
		try {
			waiting.postMessage({ type: 'SKIP_WAITING' });
		} catch {
			clearTimeout(updateTimer);
			updating.value = false;
			error.value = 'Не удалось запустить обновление. Попробуйте ещё раз.';
		}
	};
	const checkForUpdate = async () => {
		if (!registration || !navigator.onLine || Date.now() - lastCheck < 60000) return;
		lastCheck = Date.now();
		try {
			await registration.update();
		} catch {
			/* При временной потере сети текущая версия продолжает работать. */
		}
	};
	const install = async () => {
		if (installed.value || installing.value) return;
		const prompt = installPrompt.value;
		if (!prompt) {
			showInstallHelp.value = true;
			return;
		}
		installing.value = true;
		try {
			await prompt.prompt();
			const choice = await prompt.userChoice;
			if (!disposed && choice.outcome === 'accepted') installed.value = true;
		} catch {
			if (!disposed) showInstallHelp.value = true;
		} finally {
			installPrompt.value = null;
			installing.value = false;
		}
	};
	const dismiss = () => {
		dismissed.value = true;
		error.value = '';
	};

	onMounted(async () => {
		if (typeof window === 'undefined') return;
		const standalone = window.matchMedia?.('(display-mode: standalone)');
		const syncInstalled = () => {
			installed.value =
				!!standalone?.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
		};
		syncInstalled();
		if (standalone) listen(standalone, 'change', syncInstalled);
		listen(window, 'beforeinstallprompt', (event) => {
			event.preventDefault();
			installPrompt.value = event as InstallPromptEvent;
		});
		listen(window, 'appinstalled', () => {
			installed.value = true;
			installPrompt.value = null;
			showInstallHelp.value = false;
		});
		listen(window, 'beforeunload', (event) => {
			if (hasUnsavedChanges.value) {
				event.preventDefault();
				(event as BeforeUnloadEvent).returnValue = '';
			}
		});
		if (!(options.enabled ?? import.meta.env.PROD) || !('serviceWorker' in navigator)) return;
		const container = navigator.serviceWorker;
		hadController = !!container.controller;
		listen(container, 'controllerchange', () => {
			if (updating.value) {
				hadController = true;
				reload();
				return;
			}
			if (!hadController) {
				hadController = true;
				offlineReady.value = true;
				return;
			}
			markUpdate();
		});
		try {
			const scope = new URL(import.meta.env.BASE_URL, window.location.origin);
			const result = await container.register(new URL('sw.js', scope).href, {
				scope: scope.pathname,
				updateViaCache: 'none',
			});
			if (disposed) return;
			registration = result;
			if (result.active) offlineReady.value = true;
			if (result.waiting) markUpdate();
			const watchInstalling = () => {
				const worker = result.installing;
				if (!worker) return;
				listen(worker, 'statechange', () => {
					if (worker.state !== 'installed') return;
					if (container.controller) markUpdate();
					else offlineReady.value = true;
				});
			};
			listen(result, 'updatefound', watchInstalling);
			watchInstalling();
			listen(window, 'online', () => {
				lastCheck = 0;
				void checkForUpdate();
			});
			listen(document, 'visibilitychange', () => {
				if (document.visibilityState === 'visible') void checkForUpdate();
			});
		} catch {
			if (!disposed)
				error.value =
					'Не удалось подготовить приложение для работы без сети. Повторите запуск с интернетом.';
		}
	});
	onScopeDispose(() => {
		disposed = true;
		clearTimeout(updateTimer);
		cleanup.forEach((release) => release());
		drafts.clear();
	});
	return {
		offlineReady,
		needRefresh,
		dismissed,
		installed,
		installing,
		updating,
		showInstallHelp,
		error,
		updateBlocked,
		hasUnsavedChanges,
		install,
		update,
		checkForUpdate,
		dismiss,
		trackDraft,
	};
};
