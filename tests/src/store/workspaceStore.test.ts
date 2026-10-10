import { expect, it, vi } from 'vitest';
import { useWorkspaceStore } from '@/store/workspaceStore';
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
