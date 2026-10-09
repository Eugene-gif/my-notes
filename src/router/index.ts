import { createRouter, createWebHistory, type RouterHistory } from 'vue-router';
import type { Pinia } from 'pinia';
import NotesWorkspace from '@/components/NotesWorkspace/NotesWorkspace.vue';
import { useNotesStore } from '@/store/notesStore';
import { browserStorage, getFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';
export function createAppRouter(
  pinia: Pinia,
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  const notes = useNotesStore(pinia);
  const router = createRouter({
    history,
    routes: [
      { path: '/', name: 'home', component: NotesWorkspace },
      { path: '/entry/:id', name: 'entry', component: NotesWorkspace },
      { path: '/:pathMatch(.*)*', redirect: '/' },
    ],
  });
  router.beforeEach((to) => {
    if (!notes.initialized) notes.initialize();
    if (to.name === 'entry') {
      const entry = notes.entry(String(to.params.id));
      if (!entry || entry.type === 'task') return { name: 'home', replace: true };
    }
  });
  router.afterEach((to, _from, failure) => {
    if (!failure)
      saveToStorage(STORAGE_KEYS.current, to.name === 'entry' ? String(to.params.id) : null);
  });
  return router;
}
export function savedContainer(): string | null {
  const storage = browserStorage();
  const saved = getFromStorage<unknown>(STORAGE_KEYS.current, storage);
  if (typeof saved === 'string') return saved;
  try {
    return storage?.getItem('my-notes:current') !== null
      ? null
      : (storage?.getItem('todo-current-folder') ?? null);
  } catch {
    return null;
  }
}
