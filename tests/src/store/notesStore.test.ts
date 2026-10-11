import { expect, it, vi } from 'vitest';
import { useNotesStore } from '@/store/notesStore';
import { useNoticesStore } from '@/store/noticesStore';
import { persistNotes, restoreNotes } from '@/utils/persistence';
import { getChecklistStats } from '@/utils/entries';
import { fixture, memoryStorage, subtasksFixture } from '../../fixtures';

it('creates, edits, cycles statuses, moves and removes persisted entities', () => {
	const storage = memoryStorage();
	persistNotes(fixture(), storage);
	const notes = useNotesStore();
	notes.initialize(storage);
	const first = notes.create('task', 'list', 'Первая', '', 'before');
	expect(first).toBeTruthy();
	expect(notes.state.tasks.find((task) => task.id === first)?.order).toBe(0);
	expect(notes.update(first!, 'Новый текст')).toBe(true);
	expect(notes.toggleTask(first!)).toBe(true);
	expect(notes.entry(first!)?.type).toBe('task');
	expect(notes.move([first!], 'other')).toBe(true);
	expect(notes.swap(first!, 'task3')).toBe(true);
	expect(notes.remove([first!])).toBe(true);
	expect(notes.create('task', null, 'Неверно')).toBeNull();
	expect(notes.create('task', 'list', ' ')).toBeNull();
	const folder = notes.create('folder', null, '');
	expect(notes.entry(folder!)?.type).toBe('folder');
	const note = notes.create('note', folder, 'Заметка', 'Описание');
	expect(notes.update(note!, 'Новое', 'Другой текст')).toBe(true);
	expect(notes.create('checklist', folder, 'Перечень')).toBeTruthy();
	expect(notes.remove([folder!])).toBe(true);
	expect(notes.entry(note!)).toBeUndefined();
});
it('rolls back rejected persistence and does not report success', () => {
	const storage = memoryStorage();
	const notes = useNotesStore();
	notes.initialize(storage);
	vi.spyOn(storage, 'setItem').mockImplementation(() => {
		throw Error('quota');
	});
	expect(notes.create('folder', null, 'Работа')).toBeNull();
	expect(notes.state.folders).toEqual([]);
	expect(useNoticesStore().current?.status).toBe('error');
	expect(notes.update('missing', 'text')).toBe(false);
	expect(notes.toggleTask('missing')).toBe(false);
});
it('initializes once and handles unavailable storage', () => {
	const notes = useNotesStore();
	notes.initialize(null);
	notes.initialize(memoryStorage());
	expect(notes.initialized).toBe(true);
	expect(notes.create('folder', null, 'x')).toBeNull();
});

it('persists subtask status cycles and derives parent/checklist status instead of allowing manual toggles', () => {
	const storage = memoryStorage();
	persistNotes(fixture(), storage);
	const notes = useNotesStore();
	notes.initialize(storage);
	const subtasks = subtasksFixture();
	const id = notes.create('task', 'list', 'Покупки', '', 'after', subtasks)!;
	expect(notes.toggleTask(id)).toBe(false);
	expect(notes.toggleSubtask(id, 'missing')).toBe(false);
	expect(notes.toggleSubtask('note', 'subtask1')).toBe(false);
	expect(notes.toggleSubtask(id, 'subtask1')).toBe(true);
	expect(notes.entry(id)).toMatchObject({ status: 'in-progress', completed: false });
	for (const subtask of subtasks) {
		if (subtask.id === 'subtask2') notes.toggleSubtask(id, subtask.id);
		notes.toggleSubtask(id, subtask.id);
	}
	expect(notes.entry(id)).toMatchObject({ status: 'completed', completed: true });
	expect(getChecklistStats(notes.state, 'list').completed).toBe(2);
	expect(restoreNotes(storage).tasks.find((task) => task.id === id)).toEqual(notes.entry(id));
	notes.toggleSubtask(id, 'subtask1');
	expect(notes.entry(id)).toMatchObject({ status: 'in-progress', completed: false });
	notes.toggleSubtask(id, 'subtask2');
	expect(notes.entry(id)).toMatchObject({ status: 'pending', completed: false });
	expect(subtasks).toEqual(subtasksFixture());
	expect(notes.update(id, 'Без подзадач', '', [])).toBe(true);
	expect(notes.toggleTask(id)).toBe(true);
});

it('preserves retained subtask statuses when editing and rolls back rejected saves', () => {
	const storage = memoryStorage();
	const notes = useNotesStore();
	notes.initialize(storage);
	const subtasks = subtasksFixture();
	subtasks[0].status = 'completed';
	subtasks[0].completed = true;
	const id = notes.create(
		'task',
		notes.create('checklist', null, 'Перечень'),
		'Задача',
		'',
		'after',
		subtasks,
	)!;
	expect(notes.entry(id)).toMatchObject({ status: 'in-progress' });
	expect(notes.update(id, 'Правка')).toBe(true);
	expect(notes.entry(id)).toMatchObject({ subtasks });
	expect(notes.update(id, 'Правка', '', [{ ...subtasks[1], value: ' ' }])).toBe(false);
	expect(
		notes.create('task', null, 'Задача', '', 'after', [{ ...subtasks[1], value: ' ' }]),
	).toBeNull();
	const original = JSON.stringify(notes.state);
	vi.spyOn(storage, 'setItem').mockImplementation(() => {
		throw Error('quota');
	});
	expect(notes.toggleSubtask(id, 'subtask2')).toBe(false);
	expect(notes.update(id, 'Правка', '', [subtasks[1]])).toBe(false);
	expect(JSON.stringify(notes.state)).toBe(original);
});
