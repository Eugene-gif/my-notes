import { expect, it } from 'vitest';
import { advanceTaskStatus, getTaskStatus, taskStatusLabel } from '@/utils/taskStatus';
import { fixture } from '../../fixtures';
it('cycles all three statuses and respects legacy completion', () => {
  const task = fixture().tasks[0];
  expect(getTaskStatus(task)).toBe('pending');
  expect(advanceTaskStatus(task)).toBe('in-progress');
  expect(task.completed).toBe(false);
  expect(advanceTaskStatus(task)).toBe('completed');
  expect(task.completed).toBe(true);
  expect(advanceTaskStatus(task)).toBe('pending');
  expect(task.completed).toBe(false);
  expect(getTaskStatus({ completed: true })).toBe('completed');
  expect(taskStatusLabel('in-progress')).toBe('В процессе');
});
