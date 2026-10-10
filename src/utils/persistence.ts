import type { NotesState, StorageLike } from '@/types/notes';
import { createEmptyState, normalizeState } from '@/utils/normalizeState';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '@/utils/storage';

export const restoreNotes = (storage: StorageLike): NotesState => {
	const saved = getFromStorage<{ version: number; state: unknown }>(STORAGE_KEYS.state, storage);
	return saved?.version === 1 ? normalizeState(saved.state) : createEmptyState();
};

export const persistNotes = (state: NotesState, storage: StorageLike) =>
	saveToStorage(STORAGE_KEYS.state, { version: 1, state }, storage);
