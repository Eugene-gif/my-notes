import { expect, it } from 'vitest';
import IconTaskStatus from '@/assets/icons/IconTaskStatus';
it('renders supported trusted SVG variants', () => {
  expect(IconTaskStatus('pending')).toBe('');
  expect(IconTaskStatus('in-progress')).toContain('aria-hidden="true"');
  expect(IconTaskStatus('completed')).toContain('<svg');
});
