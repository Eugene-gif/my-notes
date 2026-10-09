import { expect, it } from 'vitest';
import IconFolder from '@/assets/icons/IconFolder';
it('renders supported trusted SVG variants', () => {
  for (const open of [false, true])
    for (const empty of [false, true]) expect(IconFolder(open, empty)).toContain('folder__svg');
});
