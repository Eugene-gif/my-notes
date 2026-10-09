import type { NotesState, StorageLike } from '@/types/notes';
export function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}
export function fixture(): NotesState {
  return {
    folders: [
      { id: 'folder', type: 'folder', name: 'Работа', parentId: null, order: 0 },
      { id: 'nested', type: 'folder', name: 'Проект', parentId: 'folder', order: 0 },
    ],
    checklists: [
      { id: 'list', type: 'checklist', name: 'Задачи', parentId: null, order: 1 },
      { id: 'other', type: 'checklist', name: 'Другие', parentId: 'folder', order: 1 },
    ],
    notes: [
      {
        id: 'note',
        type: 'note',
        name: 'Идеи <img src=x onerror=alert(1)>',
        description: 'Строка один\nВторая строка',
        parentId: null,
        order: 2,
      },
    ],
    tasks: [
      {
        id: 'task',
        type: 'task',
        value: 'Купить молоко',
        completed: false,
        parentId: 'list',
        order: 0,
      },
      {
        id: 'task2',
        type: 'task',
        value: 'Написать план',
        completed: true,
        parentId: 'list',
        order: 1,
      },
      {
        id: 'task3',
        type: 'task',
        value: 'Купить книгу',
        completed: false,
        parentId: 'other',
        order: 0,
      },
    ],
  };
}
