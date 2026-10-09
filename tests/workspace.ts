import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { createAppRouter } from '@/router';
import { useNotesStore } from '@/store/notesStore';
import { persistNotes } from '@/store/persistence';
import { fixture, memoryStorage } from './fixtures';
import NotesWorkspace from '@/components/NotesWorkspace/NotesWorkspace.vue';
export async function mountWorkspace(url = '/') {
  const pinia = createPinia(),
    storage = memoryStorage();
  persistNotes(fixture(), storage);
  const notes = useNotesStore(pinia);
  notes.initialize(storage);
  const router = createAppRouter(pinia, createMemoryHistory());
  await router.push(url);
  await router.isReady();
  const wrapper = mount(NotesWorkspace, {
    global: { plugins: [pinia, router] },
    attachTo: document.body,
  });
  return { wrapper, notes, router, pinia };
}
