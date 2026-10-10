import { expect, it } from 'vitest';
import {
	formatFolderName,
	pluralize,
	taskCount,
	elementCount,
	containerNoun,
} from '@/utils/format';

it('formats default names in Moscow and Russian count forms', () => {
	expect(formatFolderName(new Date('2026-10-09T12:05:00Z'))).toBe('09.10.2026 в 15:05');
	expect([0, 1, 2, 5, 11, 21, 22, 25, 111].map(taskCount)).toEqual([
		'0 задач',
		'1 задача',
		'2 задачи',
		'5 задач',
		'11 задач',
		'21 задача',
		'22 задачи',
		'25 задач',
		'111 задач',
	]);
	expect(elementCount(21)).toBe('21 элемент');
	expect(pluralize(-2, ['a', 'b', 'c'])).toBe('-2 b');
	expect(['note', 'checklist', 'folder'].map(containerNoun)).toEqual([
		'заметку',
		'перечень',
		'папку',
	]);
});
