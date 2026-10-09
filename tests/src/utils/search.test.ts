import { expect, it } from 'vitest';
import {
  searchEntries,
  highlightSegments,
  ancestorEntries,
  entryPath,
  descriptionSnippet,
} from '@/utils/search';
import { fixture } from '../../fixtures';
it('searches globally but scopes checklist searches and includes note descriptions', () => {
  const state = fixture();
  expect(searchEntries(state, ' КУПИТЬ ', null).map((entry) => entry.id)).toEqual([
    'task',
    'task3',
  ]);
  expect(searchEntries(state, 'купить', 'list').map((entry) => entry.id)).toEqual(['task']);
  expect(searchEntries(state, 'ВТОРАЯ', null)[0].id).toBe('note');
  expect(searchEntries(state, ' ', null)).toEqual([]);
});
it('preserves user text and handles repeated matches and empty queries', () => {
  expect(highlightSegments('Аба АБА <img>', 'аба')).toEqual([
    { text: 'Аба', match: true },
    { text: ' ', match: false },
    { text: 'АБА', match: true },
    { text: ' <img>', match: false },
  ]);
  expect(highlightSegments('<script>', '')).toEqual([{ text: '<script>', match: false }]);
});
it('builds ancestor paths safely and bounds description snippets', () => {
  const state = fixture();
  expect(ancestorEntries(state, 'nested').map((entry) => entry.name)).toEqual(['Работа', 'Проект']);
  expect(entryPath(state, state.tasks[2])).toBe('Главная › Работа › Другие');
  state.folders[0].parentId = 'nested';
  expect(ancestorEntries(state, 'nested')).toHaveLength(2);
  expect(descriptionSnippet('x'.repeat(300) + 'match', 'match')).toContain('match');
  expect(descriptionSnippet('x'.repeat(300) + 'match', 'match')).toMatch(/^…/);
});
