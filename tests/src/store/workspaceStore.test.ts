import { expect, it, vi } from 'vitest';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useNoticesStore } from '@/store/noticesStore';
import { APP_PREFIX } from '@/constants/storage';

it('restores and saves the current layout preference', () => {
	localStorage.setItem('todo-layout', '3');
	const store = useWorkspaceStore();
	store.initialize();
	expect(store.layout).toBe('1');
	localStorage.setItem(APP_PREFIX + 'layout', '"3"');
	store.initialize();
	expect(store.layout).toBe('3');
	expect(store.setLayout('2')).toBe(true);
	expect(localStorage.getItem(APP_PREFIX + 'layout')).toBe('"2"');
});
it('keeps previous preference when storage fails', () => {
	const store = useWorkspaceStore();
	vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw Error('quota');
	});
	expect(store.setLayout('3')).toBe(false);
	expect(store.layout).toBe('1');
});

it.each(['light', 'dark'] as const)('restores the saved %s theme', (theme) => {
	localStorage.setItem(APP_PREFIX + 'theme', JSON.stringify(theme));
	const store = useWorkspaceStore();
	store.initialize();
	expect(store.theme).toBe(theme);
});

it.each([null, 'unknown', '{broken', '"system"', '{}'])('ignores an invalid theme: %s', (value) => {
	if (value !== null) localStorage.setItem(APP_PREFIX + 'theme', value);
	const store = useWorkspaceStore();
	store.initialize();
	expect(store.theme).toBe('light');
});

it('switches and saves both themes without changing the layout', () => {
	const store = useWorkspaceStore();
	expect(store.toggleTheme()).toBe(true);
	expect(store.theme).toBe('dark');
	expect(localStorage.getItem(APP_PREFIX + 'theme')).toBe('"dark"');
	expect(store.toggleTheme()).toBe(true);
	expect(store.theme).toBe('light');
	expect(localStorage.getItem(APP_PREFIX + 'theme')).toBe('"light"');
	expect(store.layout).toBe('1');
});

it('still switches the theme when storage is unavailable and reports the failure', () => {
	const store = useWorkspaceStore();
	vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw Error('quota');
	});
	expect(store.toggleTheme()).toBe(false);
	expect(store.theme).toBe('dark');
	expect(useNoticesStore().current?.status).toBe('error');
});
