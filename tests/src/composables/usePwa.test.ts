import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { usePwa } from '@/composables/usePwa';
import { withSetup } from '../../composable';

class Worker extends EventTarget {
	state: ServiceWorkerState = 'installing';
	postMessage = vi.fn();
	installed = () => {
		this.state = 'installed';
		this.dispatchEvent(new Event('statechange'));
	};
}
class Registration extends EventTarget {
	active: Worker | null = null;
	waiting: Worker | null = null;
	installing: Worker | null = null;
	update = vi.fn().mockResolvedValue(undefined);
}
class Container extends EventTarget {
	controller: Worker | null = null;
	register = vi.fn();
}

const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
let container: Container;
let registration: Registration;
let media: EventTarget & { matches: boolean };

beforeEach(() => {
	container = new Container();
	registration = new Registration();
	container.register.mockResolvedValue(registration);
	media = Object.assign(new EventTarget(), { matches: false });
	Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: container });
	Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => media });
});
afterEach(() => {
	if (originalServiceWorker)
		Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
	else Reflect.deleteProperty(navigator, 'serviceWorker');
	if (originalMatchMedia) Object.defineProperty(window, 'matchMedia', originalMatchMedia);
	else Reflect.deleteProperty(window, 'matchMedia');
});

const setup = async () => {
	const reload = vi.fn();
	const mounted = withSetup(() => usePwa({ enabled: true, reload }));
	await flushPromises();
	return { ...mounted, reload };
};

it('registers once and marks the first completed installation as offline ready', async () => {
	const worker = new Worker();
	registration.installing = worker;
	const { result, reload } = await setup();
	expect(container.register).toHaveBeenCalledWith(expect.stringMatching(/\/sw\.js$/), {
		scope: '/',
		updateViaCache: 'none',
	});
	expect(result.offlineReady.value).toBe(false);
	worker.installed();
	container.controller = worker;
	container.dispatchEvent(new Event('controllerchange'));
	expect(result.offlineReady.value).toBe(true);
	expect(result.needRefresh.value).toBe(false);
	expect(reload).not.toHaveBeenCalled();
});

it('requests activation only after drafts are saved and reloads only the initiating tab', async () => {
	container.controller = new Worker();
	registration.active = container.controller;
	registration.waiting = new Worker();
	const { result, reload } = await setup();
	const dirty = ref(true);
	const release = result.trackDraft(dirty);
	result.update();
	expect(result.updateBlocked.value).toBe(true);
	expect(registration.waiting.postMessage).not.toHaveBeenCalled();
	dirty.value = false;
	result.update();
	result.update();
	expect(registration.waiting.postMessage).toHaveBeenCalledExactlyOnceWith({
		type: 'SKIP_WAITING',
	});
	container.dispatchEvent(new Event('controllerchange'));
	expect(reload).toHaveBeenCalledTimes(1);
	release();
	result.dismiss();
	container.dispatchEvent(new Event('controllerchange'));
	expect(result.dismissed.value).toBe(false);
	expect(result.needRefresh.value).toBe(true);
	expect(reload).toHaveBeenCalledTimes(1);
});

it('keeps a draft typed during activation and permits a later reload of the active version', async () => {
	container.controller = new Worker();
	registration.waiting = new Worker();
	const { result, reload } = await setup();
	const dirty = ref(false);
	result.trackDraft(dirty);
	result.update();
	dirty.value = true;
	registration.waiting = null;
	container.dispatchEvent(new Event('controllerchange'));
	expect(reload).not.toHaveBeenCalled();
	expect(result.updateBlocked.value).toBe(true);
	dirty.value = false;
	result.update();
	expect(reload).toHaveBeenCalledTimes(1);
});

it('notifies other tabs without reloading and detects a newly installed update', async () => {
	container.controller = new Worker();
	const { result, reload } = await setup();
	registration.installing = new Worker();
	registration.dispatchEvent(new Event('updatefound'));
	registration.installing.installed();
	expect(result.needRefresh.value).toBe(true);
	container.dispatchEvent(new Event('controllerchange'));
	expect(reload).not.toHaveBeenCalled();
});

it('offers retry after activation timeout and removes listeners on disposal', async () => {
	vi.useFakeTimers();
	container.controller = new Worker();
	registration.waiting = new Worker();
	const { result, wrapper, reload } = await setup();
	result.update();
	await vi.advanceTimersByTimeAsync(10000);
	expect(result.updating.value).toBe(false);
	expect(result.error.value).toContain('Попробуйте ещё раз');
	result.update();
	expect(result.error.value).toBe('');
	const dirty = ref(true);
	result.trackDraft(dirty);
	const beforeUnload = new Event('beforeunload', { cancelable: true });
	window.dispatchEvent(beforeUnload);
	expect(beforeUnload.defaultPrevented).toBe(true);
	wrapper.unmount();
	container.dispatchEvent(new Event('controllerchange'));
	await vi.advanceTimersByTimeAsync(10000);
	expect(reload).not.toHaveBeenCalled();
	expect(result.hasUnsavedChanges.value).toBe(false);
	const afterUnload = new Event('beforeunload', { cancelable: true });
	window.dispatchEvent(afterUnload);
	expect(afterUnload.defaultPrevented).toBe(false);
});

it('uses the browser installation prompt and hides installation after acceptance', async () => {
	const { result } = await setup();
	const prompt = vi.fn().mockResolvedValue(undefined);
	const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
		prompt,
		userChoice: Promise.resolve({ outcome: 'accepted' }),
	});
	window.dispatchEvent(event);
	expect(event.defaultPrevented).toBe(true);
	await result.install();
	expect(prompt).toHaveBeenCalledTimes(1);
	expect(result.installed.value).toBe(true);
	await result.install();
	expect(prompt).toHaveBeenCalledTimes(1);
});

it('allows retry when an unavailable worker rejects activation', async () => {
	container.controller = new Worker();
	registration.waiting = new Worker();
	registration.waiting.postMessage.mockImplementationOnce(() => {
		throw new Error('redundant');
	});
	const { result, reload } = await setup();
	expect(() => result.update()).not.toThrow();
	expect(result.updating.value).toBe(false);
	expect(result.error.value).toContain('Попробуйте ещё раз');
	expect(reload).not.toHaveBeenCalled();
	result.update();
	expect(result.updating.value).toBe(true);
	expect(result.error.value).toBe('');
});

it('keeps basic functionality available when service workers are unsupported', () => {
	Reflect.deleteProperty(navigator, 'serviceWorker');
	const { result } = withSetup(() => usePwa({ enabled: true }));
	expect(result.error.value).toBe('');
	expect(result.offlineReady.value).toBe(false);
	expect(container.register).not.toHaveBeenCalled();
});

it('shows platform instructions without a prompt and responds to installation events', async () => {
	const { result } = await setup();
	await result.install();
	expect(result.showInstallHelp.value).toBe(true);
	window.dispatchEvent(new Event('appinstalled'));
	expect(result.installed.value).toBe(true);
	expect(result.showInstallHelp.value).toBe(false);
	media.matches = true;
	media.dispatchEvent(new Event('change'));
	expect(result.installed.value).toBe(true);
});

it('handles dismissing and failing installation without leaving a pending state', async () => {
	const { result } = await setup();
	for (const failure of [false, true]) {
		const prompt = failure
			? vi.fn().mockRejectedValue(new Error('unavailable'))
			: vi.fn().mockResolvedValue(undefined);
		window.dispatchEvent(
			Object.assign(new Event('beforeinstallprompt'), {
				prompt,
				userChoice: Promise.resolve({ outcome: 'dismissed' }),
			}),
		);
		await result.install();
		expect(result.installed.value).toBe(false);
		expect(result.installing.value).toBe(false);
		expect(result.showInstallHelp.value).toBe(failure);
	}
});

it('checks on reconnect, throttles checks and tolerates a failed network request', async () => {
	const { result } = await setup();
	await result.checkForUpdate();
	await result.checkForUpdate();
	expect(registration.update).toHaveBeenCalledTimes(1);
	registration.update.mockRejectedValue(new Error('offline'));
	window.dispatchEvent(new Event('online'));
	await flushPromises();
	expect(registration.update).toHaveBeenCalledTimes(2);
	expect(result.error.value).toBe('');
});

it('handles registration failure, disabled registration and disposal during registration', async () => {
	container.register.mockRejectedValueOnce(new Error('failed'));
	const first = await setup();
	expect(first.result.error.value).toContain('без сети');
	first.wrapper.unmount();
	withSetup(() => usePwa({ enabled: false }));
	expect(container.register).toHaveBeenCalledTimes(1);
	let complete!: (value: Registration) => void;
	container.register.mockReturnValue(
		new Promise<Registration>((resolve) => {
			complete = resolve;
		}),
	);
	const late = withSetup(() => usePwa({ enabled: true }));
	late.wrapper.unmount();
	registration.waiting = new Worker();
	complete(registration);
	await flushPromises();
	expect(late.result.needRefresh.value).toBe(false);
});
