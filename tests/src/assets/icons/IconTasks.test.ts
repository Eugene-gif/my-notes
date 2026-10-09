import { expect, it } from 'vitest';
import IconTasks from '@/assets/icons/IconTasks';
it('renders supported trusted SVG variants', () => {
  for (const status of ['empty', 'partial', 'complete', 'invalid'])
    expect(IconTasks(status)).toContain('folder__svg');
});
