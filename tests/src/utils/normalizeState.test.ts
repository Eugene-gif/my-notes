import { expect, it } from 'vitest';
import { createEmptyState, normalizeState } from '@/utils/normalizeState';
import { fixture, subtasksFixture } from '../../fixtures';

it('copies current records without changing text, ordering or statuses', () => {
	const source = fixture();
	const normalized = normalizeState(source);
	expect(normalized).toEqual(source);
	expect(normalized.notes[0]).not.toBe(source.notes[0]);
	expect(createEmptyState()).toEqual({ tasks: [], folders: [], notes: [], checklists: [] });
});

it('rejects malformed collections, records, types, ordering and duplicate IDs', () => {
	for (const value of [null, [], 2, {}, { ...fixture(), notes: 'invalid' }])
		expect(normalizeState(value)).toEqual(createEmptyState());
	const source = fixture();
	const state = {
		...source,
		notes: [
			null,
			{},
			{ ...source.notes[0], order: Infinity },
			{ ...source.notes[0], type: 'folder' },
			{ ...source.notes[0], description: 12 },
			source.notes[0],
			source.notes[0],
		],
		tasks: [
			{ ...source.tasks[0], status: ['pending'] },
			{ ...source.tasks[0], status: undefined },
			{ ...source.tasks[0], value: 12 },
			{ ...source.tasks[0], id: '' },
			source.tasks[0],
		],
	};
	expect(normalizeState(state).notes).toEqual(source.notes);
	expect(normalizeState(state).tasks).toEqual([source.tasks[0]]);
});

it('repairs container parents and cycles without creating replacement checklists', () => {
	const source = fixture();
	source.folders[0].parentId = 'nested';
	source.checklists[0].parentId = 'list';
	source.notes[0].parentId = 'missing';
	source.tasks[0].parentId = 'folder';
	const normalized = normalizeState(source);
	expect(normalized.folders[0].parentId).toBeNull();
	expect(normalized.checklists[0].parentId).toBeNull();
	expect(normalized.notes[0].parentId).toBeNull();
	expect(normalized.notes[0].description).toBe(source.notes[0].description);
	expect(normalized.tasks.map((task) => task.id)).toEqual(['task2', 'task3']);
	expect(normalized.checklists).toHaveLength(2);
});

it('derives the completion flag from the current status', () => {
	const source = fixture();
	source.tasks[0].status = 'in-progress';
	source.tasks[0].completed = true;
	source.tasks[1].completed = false;
	const normalized = normalizeState(source);
	expect(normalized.tasks[0].completed).toBe(false);
	expect(normalized.tasks[1].completed).toBe(true);
});

it('restores valid subtasks, derives parent status and discards malformed or colliding child IDs', () => {
	const source = fixture();
	const subtasks = subtasksFixture();
	subtasks[0].status = 'completed';
	const normalized = normalizeState({
		...source,
		tasks: [
			{
				...source.tasks[0],
				subtasks: [
					null,
					{},
					{ ...subtasks[0], id: 'note' },
					{ ...subtasks[0], value: ' ' },
					{ ...subtasks[0], status: 'wrong' },
					...subtasks,
					subtasks[0],
				],
			},
			{ ...source.tasks[1], subtasks: [subtasks[0]] },
		],
	});
	expect(normalized.tasks[0]).toMatchObject({
		status: 'in-progress',
		completed: false,
		subtasks: [{ ...subtasks[0], completed: true }, subtasks[1]],
	});
	expect(normalized.tasks[1].subtasks).toEqual([]);
	expect(normalized.tasks[0].subtasks?.[0]).not.toBe(subtasks[0]);
	const complete = normalizeState({
		...source,
		tasks: [{ ...source.tasks[0], subtasks: [{ ...subtasks[0], status: 'completed' }] }],
	});
	expect(complete.tasks[0]).toMatchObject({ status: 'completed', completed: true });
});
