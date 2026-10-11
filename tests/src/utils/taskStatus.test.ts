import { expect, it } from 'vitest';
import {
	advanceTaskStatus,
	getSubtasksStatus,
	syncTaskStatus,
	taskStatusLabel,
} from '@/utils/taskStatus';
import { fixture, subtasksFixture } from '../../fixtures';
import type { TaskStatus } from '@/types/notes';

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

it.each([
	[['pending', 'pending'], 'pending'],
	[['pending', 'in-progress'], 'in-progress'],
	[['pending', 'completed'], 'in-progress'],
	[['completed', 'in-progress'], 'in-progress'],
	[['completed', 'completed'], 'completed'],
] as [TaskStatus[], TaskStatus][])('derives parent status from %j as %s', (statuses, expected) => {
	const subtasks = subtasksFixture().map((subtask, index) => ({
		...subtask,
		status: statuses[index],
		completed: statuses[index] === 'completed',
	}));
	expect(getSubtasksStatus(subtasks)).toBe(expected);
	const task = { ...fixture().tasks[0], subtasks };
	syncTaskStatus(task);
	expect(task.status).toBe(expected);
	expect(task.completed).toBe(expected === 'completed');
});

it('preserves manual status without subtasks and reports no activity for an empty list', () => {
	const task = fixture().tasks[1];
	syncTaskStatus(task);
	expect(task.status).toBe('completed');
	expect(getSubtasksStatus([])).toBe('pending');
});
