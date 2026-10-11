import { createPinia } from 'pinia';
import { expect, it, vi } from 'vitest';
import { useClipboardStore } from '@/store/clipboardStore';
import { useNotesStore } from '@/store/notesStore';
import { useNoticesStore } from '@/store/noticesStore';
import { persistNotes, restoreNotes } from '@/utils/persistence';
import { fixture, memoryStorage, subtasksFixture } from '../../fixtures';

const setup = () => {
	const storage = memoryStorage();
	persistNotes(fixture(), storage);
	const notes = useNotesStore();
	notes.initialize(storage);
	return { storage, notes, clipboard: useClipboardStore() };
};

it('retains a snapshot after originals change or disappear and clears it only after paste', () => {
	const { storage, notes, clipboard } = setup();
	expect(clipboard.copy([])).toBe(false);
	expect(clipboard.copy(['list', 'note'])).toBe(true);
	expect(clipboard.count).toBe(2);
	notes.update('note', 'Другое', 'Другой текст');
	notes.remove(['list']);
	expect(clipboard.canPaste('folder')).toBe(true);
	expect(clipboard.paste('folder')).toBe(true);
	expect(clipboard.buffer).toBeNull();
	expect(clipboard.count).toBe(0);
	expect(notes.state.notes.find((note) => note.parentId === 'folder')).toMatchObject({
		description: fixture().notes[0].description,
	});
	expect(notes.state.tasks).toHaveLength(3);
	expect(restoreNotes(storage)).toEqual(notes.state);
	expect(clipboard.paste('folder')).toBe(false);
});

it('retains the buffer and all original data when persistence fails, then allows retry', () => {
	const { storage, notes, clipboard } = setup();
	clipboard.copy(['folder']);
	const original = JSON.stringify(notes.state);
	const setItem = vi.spyOn(storage, 'setItem').mockImplementation(() => {
		throw Error('quota');
	});
	expect(clipboard.paste(null)).toBe(false);
	expect(JSON.stringify(notes.state)).toBe(original);
	expect(clipboard.count).toBe(1);
	expect(useNoticesStore().current?.status).toBe('error');
	setItem.mockRestore();
	expect(clipboard.paste(null)).toBe(true);
	expect(clipboard.buffer).toBeNull();
});

it('keeps the buffer on an incompatible paste and cancels without modifying notes', () => {
	const { notes, clipboard } = setup();
	const original = JSON.stringify(notes.state);
	clipboard.copy(['task']);
	expect(clipboard.paste('folder')).toBe(false);
	expect(clipboard.count).toBe(1);
	expect(clipboard.copy(['missing'])).toBe(false);
	expect(clipboard.count).toBe(1);
	clipboard.clear();
	expect(clipboard.canPaste('list')).toBe(false);
	expect(JSON.stringify(notes.state)).toBe(original);
});

it('keeps the clipboard scoped to its Pinia instance', () => {
	const { clipboard } = setup();
	clipboard.copy(['note']);
	expect(useClipboardStore(createPinia()).buffer).toBeNull();
	expect(clipboard.count).toBe(1);
});

it('pastes independently persisted subtasks and keeps their snapshot when originals change', () => {
	const { storage, notes, clipboard } = setup();
	notes.update('task', 'Покупки', '', subtasksFixture());
	notes.toggleSubtask('task', 'subtask1');
	clipboard.copy(['list']);
	notes.toggleSubtask('task', 'subtask1');
	expect(clipboard.paste('folder')).toBe(true);
	const checklist = notes.state.checklists.find(
		(entry) => entry.id !== 'list' && entry.id !== 'other',
	)!;
	const copy = notes.state.tasks.find(
		(entry) => entry.parentId === checklist.id && entry.value === 'Покупки',
	)!;
	expect(copy.subtasks?.[0]).toMatchObject({ status: 'in-progress' });
	expect(copy.subtasks?.[0].id).not.toBe('subtask1');
	notes.toggleSubtask(copy.id, copy.subtasks![0].id);
	expect(restoreNotes(storage).tasks.find((task) => task.id === copy.id)).toMatchObject({
		subtasks: [{ status: 'completed' }, { status: 'pending' }],
	});
	expect(notes.state.tasks.find((task) => task.id === 'task')?.subtasks?.[0].status).toBe(
		'completed',
	);
	expect(clipboard.buffer).toBeNull();
});
