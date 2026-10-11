import { expect, it, vi } from 'vitest';
import { createClipboard, canPasteClipboard, pasteClipboard } from '@/utils/clipboard';
import { allEntries, getChildren } from '@/utils/entries';
import { fixture } from '../../fixtures';

it('snapshots complete trees, deduplicates descendants and rejects missing selections', () => {
	const state = fixture();
	const clipboard = createClipboard(state, ['folder', 'nested', 'folder'])!;
	expect(clipboard.rootIds).toEqual(['folder']);
	expect(clipboard.entries.map((entry) => entry.id).sort()).toEqual([
		'folder',
		'nested',
		'other',
		'task3',
	]);
	state.folders[0].name = 'Изменено';
	state.tasks[2].value = 'Другой текст';
	expect(clipboard.entries.find((entry) => entry.id === 'folder')).toMatchObject({
		name: 'Работа',
	});
	expect(clipboard.entries.find((entry) => entry.id === 'task3')).toMatchObject({
		value: 'Купить книгу',
	});
	expect(createClipboard(state, [])).toBeNull();
	expect(createClipboard(state, ['folder', 'missing'])).toBeNull();
});

it('copies a mixed selection with new IDs, remapped parents and unchanged content', () => {
	const state = fixture();
	state.notes.push({ ...state.notes[0], id: 'child-note', parentId: 'nested', order: 8 });
	const original = structuredClone(state);
	const clipboard = createClipboard(state, ['folder', 'list', 'note'])!;
	expect(pasteClipboard(state, clipboard, null)).toBe(true);
	const originalIds = new Set(allEntries(original).map((entry) => entry.id));
	const copies = allEntries(state).filter((entry) => !originalIds.has(entry.id));
	expect(copies).toHaveLength(clipboard.entries.length);
	expect(new Set(allEntries(state).map((entry) => entry.id)).size).toBe(allEntries(state).length);
	expect(allEntries(state).filter((entry) => originalIds.has(entry.id))).toEqual(
		allEntries(original),
	);
	const replacements = new Map(
		clipboard.entries.map((entry, index) => [entry.id, copies[index].id]),
	);
	clipboard.entries.forEach((entry, index) => {
		const rootIndex = clipboard.rootIds.indexOf(entry.id);
		expect(copies[index]).toEqual({
			...entry,
			id: replacements.get(entry.id),
			parentId: rootIndex >= 0 ? null : replacements.get(entry.parentId!),
			order: rootIndex >= 0 ? 3 + rootIndex : entry.order,
		});
	});
	expect(
		getChildren(state, null)
			.slice(-3)
			.map((entry) => entry.id),
	).toEqual(clipboard.rootIds.map((id) => replacements.get(id)));
	copies.find((entry) => entry.type === 'task')!.order = 100;
	expect(state.tasks[0]).toEqual(original.tasks[0]);
	expect(clipboard.entries).toEqual(allEntries(original));
});

it('supports pasting a folder into itself or its descendant using a finite snapshot', () => {
	for (const destination of ['folder', 'nested']) {
		const state = fixture();
		const clipboard = createClipboard(state, ['folder'])!;
		const count = allEntries(state).length;
		expect(pasteClipboard(state, clipboard, destination)).toBe(true);
		expect(allEntries(state)).toHaveLength(count + clipboard.entries.length);
		const copy = getChildren(state, destination).find(
			(entry) => entry.type === 'folder' && entry.id !== 'nested',
		)!;
		expect(copy.id).not.toBe('folder');
		expect(getChildren(state, copy.id)).toHaveLength(2);
	}
});

it('copies tasks only into checklists and retains their statuses and relative order', () => {
	const state = fixture();
	const original = structuredClone(state);
	const clipboard = createClipboard(state, ['task', 'task2'])!;
	for (const destination of [null, 'folder', 'note', 'missing']) {
		expect(canPasteClipboard(state, clipboard, destination)).toBe(false);
		expect(pasteClipboard(state, clipboard, destination)).toBe(false);
		expect(state).toEqual(original);
	}
	expect(pasteClipboard(state, clipboard, 'other')).toBe(true);
	expect(getChildren(state, 'other').slice(1)).toMatchObject([
		{ value: 'Купить молоко', status: 'pending', completed: false, parentId: 'other', order: 1 },
		{ value: 'Написать план', status: 'completed', completed: true, parentId: 'other', order: 2 },
	]);
	expect(pasteClipboard(state, clipboard, 'list')).toBe(true);
	expect(getChildren(state, 'list')).toHaveLength(4);
});

it('rejects incompatible destinations and appends containers after existing siblings', () => {
	const state = fixture();
	const clipboard = createClipboard(state, ['note', 'list'])!;
	const original = structuredClone(state);
	for (const destination of ['list', 'task', 'note', 'missing']) {
		expect(pasteClipboard(state, clipboard, destination)).toBe(false);
		expect(state).toEqual(original);
	}
	expect(pasteClipboard(state, clipboard, 'folder')).toBe(true);
	expect(getChildren(state, 'folder')).toMatchObject([
		{ id: 'nested' },
		{ id: 'other' },
		{ type: 'note', order: 2 },
		{ type: 'checklist', order: 3 },
	]);
});

it('avoids ID collisions with originals and other newly created entries', () => {
	const state = fixture();
	const clipboard = createClipboard(state, ['list'])!;
	const randomUUID = crypto.randomUUID.bind(crypto);
	const generated = randomUUID();
	vi.spyOn(crypto, 'randomUUID')
		.mockReturnValueOnce('list' as ReturnType<typeof crypto.randomUUID>)
		.mockReturnValueOnce(generated)
		.mockReturnValueOnce(generated)
		.mockImplementation(randomUUID);
	expect(pasteClipboard(state, clipboard, null)).toBe(true);
	expect(new Set(allEntries(state).map((entry) => entry.id)).size).toBe(allEntries(state).length);
});

it('traverses deeply nested folders without recursive stack growth', () => {
	const state = fixture();
	for (let index = 0; index < 3000; index++)
		state.folders.push({
			id: 'deep-' + index,
			type: 'folder',
			name: 'Глубина',
			parentId: index ? 'deep-' + (index - 1) : 'nested',
			order: index,
		});
	const clipboard = createClipboard(state, ['folder'])!;
	expect(clipboard.entries).toHaveLength(3004);
	expect(pasteClipboard(state, clipboard, null)).toBe(true);
});
