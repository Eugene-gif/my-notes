import { expect, it } from 'vitest';
import { containerIcon } from '@/utils/icons';
import { fixture } from '../../fixtures';
it('renders trusted icons for entity states', () => {
  const state = fixture();
  expect(containerIcon(state.notes[0], state)).toContain('<svg');
  expect(containerIcon(state.folders[0], state, true)).toContain('folder__svg');
  expect(containerIcon(state.checklists[0], state)).toContain('<svg');
});
