import { expect, it } from 'vitest';
import IconText from '@/assets/icons/IconText';
it('renders supported trusted SVG variants', () => {
  expect(IconText()).toContain('folder__svg');
});
