import type { Entry, EntryClipboard, NotesState, ParentId } from '@/types/notes';
import { allEntries, getChildren, getEntry } from '@/utils/entries';

const createClipboard = (state: NotesState, ids: string[]): EntryClipboard | null => {
	const entries = allEntries(state);
	const byId = new Map(entries.map((entry) => [entry.id, entry]));
	const selected = new Set(ids);
	if (!selected.size || ids.some((id) => !byId.has(id))) return null;

	const rootIds = [...selected].filter((id) => {
		const seen = new Set([id]);
		let parentId = byId.get(id)!.parentId;
		while (parentId !== null && !seen.has(parentId)) {
			if (selected.has(parentId)) return false;
			seen.add(parentId);
			parentId = byId.get(parentId)?.parentId ?? null;
		}
		return true;
	});
	const children = new Map<ParentId, Entry[]>();
	entries.forEach((entry) => {
		const siblings = children.get(entry.parentId) ?? [];
		siblings.push(entry);
		children.set(entry.parentId, siblings);
	});
	const included = new Set(rootIds);
	const pending = [...rootIds];
	while (pending.length) {
		const id = pending.pop()!;
		for (const child of children.get(id) ?? []) {
			if (included.has(child.id)) continue;
			included.add(child.id);
			pending.push(child.id);
		}
	}

	return { rootIds, entries: structuredClone(entries.filter((entry) => included.has(entry.id))) };
};

const canPasteClipboard = (state: NotesState, clipboard: EntryClipboard, parentId: ParentId) => {
	const parent = getEntry(state, parentId);
	const byId = new Map(clipboard.entries.map((entry) => [entry.id, entry]));
	return (
		clipboard.rootIds.length > 0 &&
		clipboard.rootIds.every((id) => {
			const entry = byId.get(id);
			if (!entry) return false;
			return entry.type === 'task'
				? parent?.type === 'checklist'
				: parentId === null || parent?.type === 'folder';
		})
	);
};

const pasteClipboard = (state: NotesState, clipboard: EntryClipboard, parentId: ParentId) => {
	if (!canPasteClipboard(state, clipboard, parentId)) return false;
	const usedIds = new Set([...allEntries(state), ...clipboard.entries].map((entry) => entry.id));
	const replacements = new Map<string, string>();
	clipboard.entries.forEach((entry) => {
		let id = crypto.randomUUID();
		while (usedIds.has(id)) id = crypto.randomUUID();
		usedIds.add(id);
		replacements.set(entry.id, id);
	});
	const order = (getChildren(state, parentId).at(-1)?.order ?? -1) + 1;
	const roots = new Map(clipboard.rootIds.map((id, index) => [id, index]));
	const copies = structuredClone(clipboard.entries).map((entry) => {
		const index = roots.get(entry.id);
		return {
			...entry,
			id: replacements.get(entry.id)!,
			parentId: index !== undefined ? parentId : replacements.get(entry.parentId!)!,
			order: index !== undefined ? order + index : entry.order,
		};
	});
	copies.forEach((entry) => {
		if (entry.type === 'task') state.tasks.push(entry);
		if (entry.type === 'folder') state.folders.push(entry);
		if (entry.type === 'checklist') state.checklists.push(entry);
		if (entry.type === 'note') state.notes.push(entry);
	});
	return true;
};

export { createClipboard, canPasteClipboard, pasteClipboard };
