import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Layout } from '@/types/notes';
import { browserStorage, getFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';
import { useNoticesStore } from './noticesStore';

export const useWorkspaceStore = defineStore('workspace', () => {
  const layout = ref<Layout>('1');
  const notices = useNoticesStore();
  function initialize() {
    const storage = browserStorage();
    let saved = getFromStorage<string>(STORAGE_KEYS.layout, storage);
    try {
      saved ??= storage?.getItem('todo-layout') ?? null;
    } catch {
      /* Use default. */
    }
    if (saved === '1' || saved === '2' || saved === '3') layout.value = saved;
  }
  function setLayout(value: Layout) {
    if (!saveToStorage(STORAGE_KEYS.layout, value)) {
      notices.show('Не удалось сохранить вид списка.', 'error');
      return false;
    }
    layout.value = value;
    notices.show('Вид списка сохранён.', 'success');
    return true;
  }
  return { layout, initialize, setLayout };
});
