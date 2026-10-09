import type { NotesState, StorageLike } from '@/types/notes';
import { loadState } from './legacyStorage';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';
export function restoreNotes(storage: StorageLike): NotesState {
  const saved = getFromStorage<{ version: number; state: NotesState }>(STORAGE_KEYS.state, storage);
  if (
    saved?.version === 1 &&
    saved.state &&
    typeof saved.state === 'object' &&
    ['tasks', 'folders', 'checklists', 'notes'].every((key) =>
      Array.isArray(saved.state[key as keyof NotesState]),
    )
  ) {
    const keys: Record<string, keyof NotesState> = {
      tasks: 'tasks',
      'todo-folders': 'folders',
      'todo-checklists': 'checklists',
      'todo-notes': 'notes',
    };
    return loadState({
      getItem: (key) => JSON.stringify(saved.state[keys[key]] ?? []),
      setItem: () => {},
    });
  }
  return loadState(storage);
}
export const persistNotes = (state: NotesState, storage: StorageLike) =>
  saveToStorage(STORAGE_KEYS.state, { version: 1, state }, storage);
