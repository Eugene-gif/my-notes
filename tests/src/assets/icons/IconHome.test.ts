import { expect, it } from 'vitest';
import IconHome from '@/assets/icons/IconHome';
it('renders supported trusted SVG variants', () => {
  expect(IconHome()).toContain('aria-hidden="true"');
});
