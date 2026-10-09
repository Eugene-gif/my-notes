import { expect, it } from 'vitest';
import { persistNotes, restoreNotes } from '@/store/persistence';
import { fixture, memoryStorage } from '../../fixtures';
it('migrates legacy data and writes one versioned snapshot while retaining legacy keys', () => {
  const storage = memoryStorage({
    tasks: JSON.stringify([{ id: 'old', value: 'Текст', completed: true }]),
  });
  const restored = restoreNotes(storage);
  expect(restored.tasks[0].value).toBe('Текст');
  expect(restored.tasks[0].parentId).toMatch(/^legacy-checklist/);
  expect(persistNotes(restored, storage)).toBe(true);
  expect(restoreNotes(storage)).toEqual(restored);
  expect(storage.getItem('tasks')).not.toBeNull();
});
it('normalizes snapshots and falls back for broken data', () => {
  const storage = memoryStorage();
  persistNotes(fixture(), storage);
  expect(restoreNotes(storage)).toEqual(fixture());
  storage.setItem('my-notes:state', '{');
  expect(restoreNotes(storage).tasks).toEqual([]);
});
