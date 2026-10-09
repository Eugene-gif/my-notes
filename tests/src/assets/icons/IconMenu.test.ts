import { expect, it } from 'vitest';
import IconMenu from '@/assets/icons/IconMenu';
it('renders supported trusted SVG variants', () => {
  for (const action of [
    'add',
    'search',
    'view',
    'select',
    'rename',
    'edit',
    'edit-note',
    'delete',
    'open',
    'move',
    'swap',
    'folder',
    'text',
    'checklist',
  ])
    expect(IconMenu(action)).toContain('menu__icon');
  expect(() => IconMenu('invalid')).toThrow('Unknown menu action');
});
