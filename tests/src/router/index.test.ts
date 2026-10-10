import { createPinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { expect, it } from 'vitest';
import { createAppRouter, savedContainer } from '@/router';
import { useNotesStore } from '@/store/notesStore';
import { fixture, memoryStorage } from '../../fixtures';
import { persistNotes } from '@/utils/persistence';
import { APP_PREFIX } from '@/constants/storage';

it('allows container routes and rejects unknown and task routes', async () => {
	const pinia = createPinia();
	const storage = memoryStorage();
	persistNotes(fixture(), storage);
	useNotesStore(pinia).initialize(storage);
	const router = createAppRouter(pinia, createMemoryHistory());
	await router.push('/entry/note');
	expect(router.currentRoute.value.params.id).toBe('note');
	expect(localStorage.getItem(APP_PREFIX + 'current')).toBe('"note"');
	await router.push('/entry/task');
	expect(router.currentRoute.value.name).toBe('home');
	await router.push('/entry/missing');
	expect(router.currentRoute.value.name).toBe('home');
	await router.push('/unknown/path');
	expect(router.currentRoute.value.name).toBe('home');
});
it('restores only the current navigation preference', () => {
	localStorage.setItem('todo-current-folder', 'folder');
	expect(savedContainer()).toBeNull();
	localStorage.setItem(APP_PREFIX + 'current', '"folder"');
	expect(savedContainer()).toBe('folder');
	localStorage.setItem(APP_PREFIX + 'current', 'null');
	expect(savedContainer()).toBeNull();
});
