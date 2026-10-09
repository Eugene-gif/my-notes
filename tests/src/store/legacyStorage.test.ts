import { expect, it } from 'vitest';
import { loadState, saveState } from '@/store/legacyStorage';
import { memoryStorage, fixture } from '../../fixtures';
it('rejects malformed rows and supports legacy roundtrips', () => {
  const storage = memoryStorage({
    tasks: '[null,2,{}, {"id":"a","value":12}]',
    'todo-folders': 'bad',
  });
  const state = loadState(storage);
  expect(state.tasks).toHaveLength(1);
  expect(state.tasks[0].value).toBe('12');
  const saved = memoryStorage();
  saveState(fixture(), saved);
  expect(loadState(saved)).toEqual(fixture());
});
