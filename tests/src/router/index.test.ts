import { createPinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { expect, it } from 'vitest';
import { createAppRouter, savedContainer } from '@/router';
import { useNotesStore } from '@/store/notesStore';
import { fixture, memoryStorage } from '../../fixtures';
import { persistNotes } from '@/store/persistence';
it('allows container routes and rejects unknown and task routes', async () => {
  const pinia = createPinia(),
    storage = memoryStorage();
  persistNotes(fixture(), storage);
  useNotesStore(pinia).initialize(storage);
  const router = createAppRouter(pinia, createMemoryHistory());
  await router.push('/entry/note');
  expect(router.currentRoute.value.params.id).toBe('note');
  expect(localStorage.getItem('my-notes:current')).toBe('"note"');
  await router.push('/entry/task');
  expect(router.currentRoute.value.name).toBe('home');
  await router.push('/entry/missing');
  expect(router.currentRoute.value.name).toBe('home');
  await router.push('/unknown/path');
  expect(router.currentRoute.value.name).toBe('home');
});
it('restores legacy navigation but honors a saved home preference', () => {
  localStorage.setItem('todo-current-folder', 'folder');
  expect(savedContainer()).toBe('folder');
  localStorage.setItem('my-notes:current', 'null');
  expect(savedContainer()).toBeNull();
});
