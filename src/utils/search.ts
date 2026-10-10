import type { Entry, NotesState, ParentId } from '@/types/notes';
import { allEntries, getChildren, getEntry } from './entries';

export interface TextSegment {
	text: string;
	match: boolean;
}

const highlightSegments = (text: string, query: string): TextSegment[] => {
	const needle = query.trim().toLocaleLowerCase('ru');
	if (!needle) return [{ text, match: false }];
	const result: TextSegment[] = [];
	const lower = text.toLocaleLowerCase('ru');
	let start = 0;

	while (start < text.length) {
		const index = lower.indexOf(needle, start);
		if (index === -1) break;

		if (index > start) result.push({ text: text.slice(start, index), match: false });
		result.push({ text: text.slice(index, index + needle.length), match: true });
		start = index + needle.length;
	}
	if (start < text.length) result.push({ text: text.slice(start), match: false });

	return result;
};

const searchEntries = (state: NotesState, query: string, currentId: ParentId): Entry[] => {
	const needle = query.trim().toLocaleLowerCase('ru');
	if (!needle) return [];
	const entries =
		getEntry(state, currentId)?.type === 'checklist'
			? getChildren(state, currentId)
			: allEntries(state);

	return entries.filter((entry) =>
		[
			entry.type === 'task' ? entry.value : entry.name,
			entry.type === 'note' ? entry.description : '',
		].some((text) => text.toLocaleLowerCase('ru').includes(needle)),
	);
};

const entryPath = (state: NotesState, entry: Entry): string => {
	return ['Главная', ...ancestorEntries(state, entry.parentId).map((parent) => parent.name)].join(
		' › ',
	);
};

const ancestorEntries = (state: NotesState, id: ParentId) => {
	const result = [];
	const seen = new Set<string>();
	let current = getEntry(state, id);
	while (current && current.type !== 'task' && !seen.has(current.id)) {
		seen.add(current.id);
		result.unshift(current);
		current = getEntry(state, current.parentId);
	}

	return result;
};

const descriptionSnippet = (text: string, query: string): string => {
	const index = text.toLocaleLowerCase('ru').indexOf(query.trim().toLocaleLowerCase('ru'));
	const start = Math.max(0, index - 60);

	return (start ? '…' : '') + text.slice(start, start + Math.max(220, query.length + 120));
};

export { highlightSegments, searchEntries, entryPath, ancestorEntries, descriptionSnippet };
