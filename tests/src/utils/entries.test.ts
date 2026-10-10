import type { Entry, NotesState, ParentId } from '@/types/notes';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { formatFolderName } from '@/utils/format';
import { advanceTaskStatus } from '@/utils/taskStatus';
import { restoreNotes, persistNotes } from '@/utils/persistence';
import {
	getChildren,
	getChecklistStats,
	canPlaceEntry,
	moveEntry,
	placeEntry,
	canSwapTasks,
	swapTasks,
	canSwapEntries,
	swapEntries,
	canPlaceEntries,
	placeEntries,
	deleteEntries,
	clearContainer,
	deleteContainer,
} from '@/utils/entries';

const storage = (initial: Record<string, string> = {}) => {
	const values = new Map(Object.entries(initial));

	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
	};
};

const tree = (): NotesState => ({
	notes: [],
	tasks: [
		{
			id: 't1',
			type: 'task',
			value: 'Первая',
			parentId: 'l1',
			status: 'completed',
			completed: true,
			order: 3,
		},
		{
			id: 't2',
			type: 'task',
			value: 'Вторая',
			parentId: 'l1',
			status: 'pending',
			completed: false,
			order: 4,
		},
		{
			id: 't3',
			type: 'task',
			value: 'Во вложенной папке',
			parentId: 'l2',
			status: 'pending',
			completed: false,
			order: 5,
		},
		{
			id: 't4',
			type: 'task',
			value: 'Соседняя',
			parentId: 'l3',
			status: 'completed',
			completed: true,
			order: 6,
		},
	],
	folders: [
		{ id: 'a', type: 'folder', name: 'Работа', parentId: null, order: 0 },
		{ id: 'b', type: 'folder', name: 'Проект', parentId: 'a', order: 1 },
		{ id: 'c', type: 'folder', name: 'Личное', parentId: null, order: 7 },
	],
	checklists: [
		{ id: 'l1', type: 'checklist', name: 'Рабочие задачи', parentId: 'a', order: 2 },
		{ id: 'l2', type: 'checklist', name: 'Задачи проекта', parentId: 'b', order: 8 },
		{ id: 'l3', type: 'checklist', name: 'Личные задачи', parentId: 'c', order: 9 },
		{ id: 'empty', type: 'checklist', name: 'Пустой', parentId: null, order: 10 },
	],
});

test('Групповая вставка сохраняет порядок выделенных задач и состояние после перезагрузки', () => {
	const state = tree();
	const saved = storage();
	state.tasks.push({
		id: 't5',
		type: 'task',
		value: 'Пятая',
		status: 'pending',
		completed: false,
		parentId: 'l1',
		order: 5,
	});
	assert.equal(placeEntries(state, ['t2', 't5'], 'l1', 't1', 'before'), true);
	assert.deepEqual(
		getChildren(state, 'l1').map((item) => item.id),
		['t2', 't5', 't1'],
	);
	assert.equal(placeEntries(state, ['t2', 't5'], 'l2', 't3', 'after'), true);
	assert.deepEqual(
		getChildren(state, 'l2').map((item) => item.id),
		['t3', 't2', 't5'],
	);
	persistNotes(state, saved);
	assert.deepEqual(restoreNotes(saved), state);
	assert.equal(state.tasks.find((item) => item.id === 't1')!.completed, true);
});

test('Групповой перенос папки и перечня сохраняет вложенные элементы; неверный перенос атомарен', () => {
	const state = tree();
	assert.equal(placeEntries(state, ['b', 'l1'], 'c'), true);
	assert.deepEqual(
		getChildren(state, 'c').map((item) => item.id),
		['l3', 'b', 'l1'],
	);
	assert.equal(state.tasks.find((item) => item.id === 't3')!.parentId, 'l2');
	const before = structuredClone(state);
	for (const [ids, parentId, reference] of [
		[['c', 'l1'], 'b', null],
		[['l1', 't1'], null, null],
		[['t1', 't2'], 'l2', 'missing'],
		[['t1', 't1'], 'l2', null],
		[['t1', 't2'], 'l1', 't1'],
	] as [string[], ParentId, ParentId][]) {
		assert.equal(placeEntries(state, ids, parentId, reference), false);
		assert.deepEqual(state, before);
	}
	assert.equal(canPlaceEntries(state, [], 'c'), false);
});

test('Обмен папки и перечня сохраняет содержимое, но запрещает циклы и несовместимые типы', () => {
	const state = tree();
	assert.equal(swapEntries(state, 'b', 'l1'), true);
	assert.deepEqual(
		getChildren(state, 'a').map((item) => item.id),
		['l1', 'b'],
	);
	assert.equal(state.checklists.find((item) => item.id === 'l2')!.parentId, 'b');
	const before = structuredClone(state);
	for (const [first, second] of [
		['a', 'b'],
		['b', 'l2'],
		['t1', 'a'],
		['a', 'a'],
		['a', 'missing'],
	]) {
		assert.equal(canSwapEntries(state, first, second), false);
		assert.equal(swapEntries(state, first, second), false);
		assert.deepEqual(state, before);
	}
});

test('Групповое удаление удаляет выбранные деревья и сохраняет соседние элементы', () => {
	const state = tree();
	state.notes.push({
		id: 'note',
		type: 'note',
		name: 'Сохранить',
		description: 'Текст',
		parentId: 'c',
		order: 20,
	});
	const before = structuredClone(state);
	assert.equal(deleteEntries(state, ['a', 'missing']), false);
	assert.deepEqual(state, before);
	assert.equal(deleteEntries(state, ['a', 't4']), true);
	assert.deepEqual(
		state.folders.map((item) => item.id),
		['c'],
	);
	assert.deepEqual(state.tasks, []);
	assert.deepEqual(
		state.checklists.map((item) => item.id),
		['l3', 'empty'],
	);
	assert.equal(state.notes[0].id, 'note');
});

test('Обмен первой и шестой задач сохраняет промежуточные позиции, текст и выполнение после перезагрузки', () => {
	const state = tree();
	const saved = storage();
	state.tasks = Array.from({ length: 6 }, (_, i) => ({
		id: `task${i}`,
		type: 'task',
		value: `Задача ${i}`,
		status: i === 5 ? 'completed' : 'pending',
		completed: i === 5,
		parentId: 'l1',
		order: i,
	}));
	assert.equal(swapTasks(state, 'task5', 'task0'), true);
	assert.deepEqual(
		getChildren(state, 'l1').map((item) => item.id),
		['task5', 'task1', 'task2', 'task3', 'task4', 'task0'],
	);
	persistNotes(state, saved);
	const restored = restoreNotes(saved);
	assert.deepEqual(getChildren(restored, 'l1'), getChildren(state, 'l1'));
	assert.equal(restored.tasks.find((item) => item.id === 'task5')!.completed, true);
	assert.equal(restored.tasks.find((item) => item.id === 'task0')!.value, 'Задача 0');
	assert.equal(swapTasks(state, 'task0', 'task5'), true);
	assert.deepEqual(
		getChildren(state, 'l1').map((item) => item.id),
		['task0', 'task1', 'task2', 'task3', 'task4', 'task5'],
	);
});

test('Обмен между перечнями сохраняет позиции соседей; неверные обмены не меняют данные', () => {
	const state = tree();
	assert.equal(swapTasks(state, 't1', 't3'), true);
	assert.deepEqual(
		getChildren(state, 'l1').map((item) => item.id),
		['t3', 't2'],
	);
	assert.deepEqual(
		getChildren(state, 'l2').map((item) => item.id),
		['t1'],
	);
	const before = structuredClone(state);
	for (const [id, other] of [
		['t1', 't1'],
		['t1', 'missing'],
		['t1', 'a'],
		['l1', 't1'],
	]) {
		assert.equal(canSwapTasks(state, id, other), false);
		assert.equal(swapTasks(state, id, other), false);
		assert.deepEqual(state, before);
	}
});

test('Заметки сохраняют название, многострочное описание, родителя и порядок', () => {
	const state = tree();
	const saved = storage();
	state.notes.push({
		id: 'note',
		type: 'note',
		name: 'Идеи',
		description: 'Строка 1\n\n<текст> & символы',
		parentId: 'a',
		order: 12,
	});
	persistNotes(state, saved);
	assert.deepEqual(restoreNotes(saved), state);
	assert.equal(getChildren(state, 'a').length, 3);
});

test('Заметку можно переставлять и переносить в папки и главную, но не в перечень или заметку', () => {
	const state = tree();
	state.notes.push({
		id: 'note',
		type: 'note',
		name: 'Идеи',
		description: 'Описание',
		parentId: null,
		order: 12,
	});
	assert.equal(placeEntry(state, 'note', null, 'a'), true);
	assert.equal(getChildren(state, null)[0].id, 'note');
	assert.equal(moveEntry(state, 'note', 'b'), true);
	assert.equal(moveEntry(state, 'note', null), true);
	const before = structuredClone(state);
	for (const [id, parentId] of [
		['note', 'l1'],
		['note', 'note'],
		['a', 'note'],
		['l1', 'note'],
		['t1', 'note'],
	]) {
		assert.equal(moveEntry(state, id, parentId), false);
	}
	assert.equal(clearContainer(state, 'note'), false);
	assert.deepEqual(state, before);
});

test('Удаление заметки сохраняет соседей; очистка и удаление папки удаляют её вложенные заметки', () => {
	const state = tree();
	state.notes.push(
		{ id: 'root-note', type: 'note', name: 'Главная', description: '', parentId: null, order: 12 },
		{
			id: 'child-note',
			type: 'note',
			name: 'Вложенная',
			description: 'Не потерять',
			parentId: 'b',
			order: 13,
		},
	);
	const beforeDelete = structuredClone(state);
	assert.equal(deleteContainer(state, 'root-note'), true);
	assert.deepEqual(state.tasks, beforeDelete.tasks);
	assert.deepEqual(state.folders, beforeDelete.folders);
	assert.deepEqual(state.checklists, beforeDelete.checklists);
	assert.deepEqual(
		state.notes.map((item) => item.id),
		['child-note'],
	);
	clearContainer(state, 'a');
	assert.deepEqual(state.notes, []);
	deleteContainer(beforeDelete, 'a');
	assert.deepEqual(
		beforeDelete.notes.map((item) => item.id),
		['root-note'],
	);
});

const ids = (entries: Entry[]) => entries.map((item) => item.id);

test('Название без имени содержит дату и московское время', () => {
	assert.equal(formatFolderName(new Date('2026-10-04T16:40:00Z')), '04.10.2026 в 19:40');
});
test('Структура, отметки и порядок восстанавливаются после сохранения', () => {
	const state = tree();
	const saved = storage();
	persistNotes(state, saved);
	assert.deepEqual(restoreNotes(saved), state);
	assert.deepEqual(ids(getChildren(state, null)), ['a', 'c', 'empty']);
});
test('Счётчик папки учитывает непосредственные элементы, а не задачи внутри перечней', () => {
	assert.equal(getChildren(tree(), 'a').length, 2);
	assert.equal(getChildren(tree(), 'b').length, 1);
});
test('Статус перечня учитывает только его задачи, пустой перечень не выполнен', () => {
	const state = tree();
	assert.deepEqual(getChecklistStats(state, 'l1'), { total: 2, completed: 1, status: 'partial' });
	state.tasks[1].completed = true;
	state.tasks[1].status = 'completed';
	assert.equal(getChecklistStats(state, 'l1').status, 'complete');
	assert.equal(getChecklistStats(state, 'l2').status, 'empty');
	assert.deepEqual(getChecklistStats(state, 'empty'), { total: 0, completed: 0, status: 'empty' });
});
test('Перечни переносятся в папки и на главную с сохранением задач', () => {
	const state = tree();
	assert.equal(moveEntry(state, 'l1', 'c'), true);
	assert.equal(getChildren(state, 'c').at(-1)!.id, 'l1');
	assert.equal(getChecklistStats(state, 'l1').total, 2);
	assert.equal(moveEntry(state, 'l1', null), true);
});
test('Задачи можно переносить только между перечнями; контейнеры не могут попасть в перечень', () => {
	const state = tree();
	assert.equal(moveEntry(state, 't1', 'l2'), true);
	assert.equal(getChecklistStats(state, 'l2').total, 2);
	const before = structuredClone(state);
	for (const [id, parent] of [
		['t1', null],
		['t1', 'a'],
		['a', 'l2'],
		['l1', 'l2'],
		['l1', 'unknown'],
	]) {
		assert.equal(canPlaceEntry(state, id!, parent), false);
		assert.equal(moveEntry(state, id!, parent), false);
	}
	assert.deepEqual(state, before);
});
test('Папку нельзя переместить в себя или потомка', () => {
	const state = tree();
	const before = structuredClone(state);
	assert.equal(moveEntry(state, 'a', 'a'), false);
	assert.equal(moveEntry(state, 'a', 'b'), false);
	assert.deepEqual(state, before);
});
test('Смешанный порядок папок и перечней меняется и сохраняется', () => {
	const state = tree();
	const saved = storage();
	assert.equal(placeEntry(state, 'empty', null, 'a'), true);
	assert.equal(placeEntry(state, 'c', null, 'a'), true);
	assert.deepEqual(ids(getChildren(state, null)), ['empty', 'c', 'a']);
	persistNotes(state, saved);
	assert.deepEqual(ids(getChildren(restoreNotes(saved), null)), ['empty', 'c', 'a']);
});
test('Задачи можно переставлять и переносить на позицию в другом перечне', () => {
	const state = tree();
	assert.equal(placeEntry(state, 't2', 'l1', 't1'), true);
	assert.deepEqual(ids(getChildren(state, 'l1')), ['t2', 't1']);
	assert.equal(placeEntry(state, 't1', 'l2', 't3', 'after'), true);
	assert.deepEqual(ids(getChildren(state, 'l2')), ['t3', 't1']);
	assert.equal(placeEntry(state, 't1', 'a', 'l1'), false);
});
test('Повторная вставка и неверные назначения не меняют данные', () => {
	const state = tree();
	const before = structuredClone(state);
	assert.equal(placeEntry(state, 't1', 'l1', 't2'), false);
	assert.equal(placeEntry(state, 'c', null, 'a', 'after'), false);
	assert.equal(placeEntry(state, 'a', null, 'a'), false);
	assert.equal(placeEntry(state, 't1', 'l1', 't3'), false);
	assert.deepEqual(state, before);
});
test('Удаление перечня удаляет его задачи и сохраняет папку и соседей', () => {
	const state = tree();
	assert.equal(deleteContainer(state, 'l1'), true);
	assert.deepEqual(ids(state.tasks), ['t3', 't4']);
	assert.equal(state.folders.length, 3);
	assert.equal(
		state.checklists.some((item) => item.id === 'l1'),
		false,
	);
});
test('Удаление папки удаляет всё её дерево, включая перечни и задачи', () => {
	const state = tree();
	deleteContainer(state, 'a');
	assert.deepEqual(ids(state.tasks), ['t4']);
	assert.deepEqual(ids(state.folders), ['c']);
	assert.deepEqual(ids(state.checklists), ['l3', 'empty']);
});
test('Очистка папки сохраняет её и соседей, удаляет вложенные перечни и задачи', () => {
	const state = tree();
	const folder = structuredClone(state.folders[0]);
	clearContainer(state, 'a');
	assert.deepEqual(state.folders[0], folder);
	assert.deepEqual(getChildren(state, 'a'), []);
	assert.deepEqual(ids(state.tasks), ['t4']);
	assert.deepEqual(ids(state.checklists), ['l3', 'empty']);
});
test('Очистка перечня сохраняет его; очистка главной, задачи и неизвестного элемента запрещена', () => {
	const state = tree();
	assert.equal(clearContainer(state, 'l1'), true);
	assert.equal(getChildren(state, 'l1').length, 0);
	assert.equal(state.checklists.length, 4);
	const before = structuredClone(state);
	for (const id of [null, 'unknown', 't3']) assert.equal(clearContainer(state, id), false);
	assert.deepEqual(state, before);
});

test('Три статуса переключаются по кругу и сохраняются после каждого изменения', () => {
	const state = tree();
	const task = state.tasks.find((task) => task.id === 't2')!;
	const saved = storage();
	for (const status of ['in-progress', 'completed', 'pending', 'in-progress']) {
		assert.equal(advanceTaskStatus(task), status);
		assert.equal(task.completed, status === 'completed');
		persistNotes(state, saved);
		const restored = restoreNotes(saved).tasks.find((item) => item.id === task.id)!;
		assert.equal(restored.status, status);
		assert.equal(restored.completed, status === 'completed');
	}
});

test('Начатая задача делает перечень частично выполненным без изменения счётчика выполнения', () => {
	const state = tree();
	state.tasks = state.tasks.filter((task) => task.id === 't2');
	assert.deepEqual(getChecklistStats(state, 'l1'), { total: 1, completed: 0, status: 'empty' });
	advanceTaskStatus(state.tasks[0]);
	assert.deepEqual(getChecklistStats(state, 'l1'), { total: 1, completed: 0, status: 'partial' });
	advanceTaskStatus(state.tasks[0]);
	assert.deepEqual(getChecklistStats(state, 'l1'), { total: 1, completed: 1, status: 'complete' });
	advanceTaskStatus(state.tasks[0]);
	assert.deepEqual(getChecklistStats(state, 'l1'), { total: 1, completed: 0, status: 'empty' });
});
