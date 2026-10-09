import { expect, it, vi } from 'vitest';
import { useNotesStore } from '@/store/notesStore';
import { useNoticesStore } from '@/store/noticesStore';
import { persistNotes } from '@/store/persistence';
import { fixture, memoryStorage } from '../../fixtures';
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
