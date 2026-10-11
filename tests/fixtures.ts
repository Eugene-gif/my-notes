import type { NotesState, StorageLike, Subtask } from '@/types/notes';

export const subtasksFixture = (): Subtask[] => [
	{ id: 'subtask1', value: 'Купить хлеб', status: 'pending', completed: false },
	{ id: 'subtask2', value: 'Купить молоко', status: 'pending', completed: false },
];

export const memoryStorage = (initial: Record<string, string> = {}): StorageLike => {
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
};

export const fixture = (): NotesState => {
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
				status: 'pending',
				completed: false,
				parentId: 'list',
				order: 0,
			},
			{
				id: 'task2',
				type: 'task',
				value: 'Написать план',
				status: 'completed',
				completed: true,
				parentId: 'list',
				order: 1,
			},
			{
				id: 'task3',
				type: 'task',
				value: 'Купить книгу',
				status: 'pending',
				completed: false,
				parentId: 'other',
				order: 0,
			},
		],
	};
};
