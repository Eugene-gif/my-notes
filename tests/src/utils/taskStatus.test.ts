import { expect, it } from 'vitest';
import { advanceTaskStatus, taskStatusLabel } from '@/utils/taskStatus';
import { fixture } from '../../fixtures';

it('cycles all three current statuses', () => {
	const task = fixture().tasks[0];
	expect(task.status).toBe('pending');
	expect(advanceTaskStatus(task)).toBe('in-progress');
	expect(task.completed).toBe(false);
	expect(advanceTaskStatus(task)).toBe('completed');
	expect(task.completed).toBe(true);
	expect(advanceTaskStatus(task)).toBe('pending');
	expect(task.completed).toBe(false);
	expect(taskStatusLabel('in-progress')).toBe('В процессе');
});
