import { afterEach, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { enableAutoUnmount } from '@vue/test-utils';

enableAutoUnmount(afterEach);
export class TestResizeObserver implements ResizeObserver {
	static instances: TestResizeObserver[] = [];
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
	constructor(public callback: ResizeObserverCallback) {
		TestResizeObserver.instances.push(this);
	}
	emit(target: Element, width = 300) {
		this.callback([{ target, contentRect: { width } } as ResizeObserverEntry], this);
	}
}

vi.stubGlobal('ResizeObserver', TestResizeObserver);
class TestPointerEvent extends MouseEvent {
	pointerId: number;
	pointerType: string;
	isPrimary: boolean;
	constructor(type: string, options: PointerEventInit = {}) {
		super(type, options);
		this.pointerId = options.pointerId ?? 1;
		this.pointerType = options.pointerType ?? 'mouse';
		this.isPrimary = options.isPrimary ?? true;
	}
}

vi.stubGlobal('PointerEvent', TestPointerEvent);
Object.defineProperties(HTMLElement.prototype, {
	setPointerCapture: {
		configurable: true,
		value: function (id: number) {
			this.dataset.capture = String(id);
		},
	},
	hasPointerCapture: {
		configurable: true,
		value: function (id: number) {
			return this.dataset.capture === String(id);
		},
	},
	releasePointerCapture: {
		configurable: true,
		value: function () {
			delete this.dataset.capture;
		},
	},
	scrollIntoView: { configurable: true, value: vi.fn() },
	showPopover: {
		configurable: true,
		value: function () {
			this.dataset.popoverOpen = 'true';
		},
	},
	hidePopover: {
		configurable: true,
		value: function () {
			delete this.dataset.popoverOpen;
		},
	},
});

const originalMatches = Element.prototype.matches;

Object.defineProperty(Element.prototype, 'matches', {
	configurable: true,
	writable: true,
	value: function (this: Element, selector: string): boolean {
		return selector === ':popover-open'
			? this.getAttribute('data-popover-open') === 'true'
			: originalMatches.call(this, selector);
	},
});

Object.defineProperties(HTMLDialogElement.prototype, {
	showModal: {
		configurable: true,
		value: function (this: HTMLDialogElement) {
			this.open = true;
			this.querySelector<HTMLElement>('[autofocus],button,input,textarea')?.focus();
		},
	},
	close: {
		configurable: true,
		value: function (this: HTMLDialogElement) {
			if (this.open) {
				this.open = false;
				this.dispatchEvent(new Event('close'));
			}
		},
	},
});

Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null });

Object.defineProperty(window, 'scrollBy', { configurable: true, value: vi.fn() });

beforeEach(() => {
	localStorage.clear();
	setActivePinia(createPinia());
	TestResizeObserver.instances = [];
});

afterEach(() => {
	vi.useRealTimers();
	document.body.innerHTML = '';
});
