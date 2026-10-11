import { defineStore } from 'pinia';
import { ref, toRaw } from 'vue';
import type {
	ContainerType,
	Entry,
	EntryClipboard,
	NotesState,
	ParentId,
	StorageLike,
	Subtask,
} from '@/types/notes';
import { browserStorage } from '@/utils/storage';
import { restoreNotes, persistNotes } from '@/utils/persistence';
import { getEntry, nextOrder, placeEntries, swapEntries, deleteEntries } from '@/utils/entries';
import { formatFolderName } from '@/utils/format';
import { advanceTaskStatus, syncTaskStatus } from '@/utils/taskStatus';
import { useNoticesStore } from './noticesStore';
import { createEmptyState } from '@/utils/normalizeState';
import { pasteClipboard } from '@/utils/clipboard';

export const useNotesStore = defineStore('notes', () => {
	const state = ref<NotesState>(createEmptyState());
	const initialized = ref(false);
	let storage: StorageLike | null = null;
	const notices = useNoticesStore();

	const initialize = (source = browserStorage()) => {
		if (initialized.value) return;
		storage = source;
		state.value = source ? restoreNotes(source) : createEmptyState();
		initialized.value = true;
		if (source && !persistNotes(toRaw(state.value), source))
			notices.show('Не удалось сохранить данные в браузере.', 'error');
	};

	const commit = (change: (draft: NotesState) => boolean, message: string): boolean => {
		const draft = structuredClone(toRaw(state.value));
		if (!change(draft)) return false;
		if (!storage || !persistNotes(draft, storage)) {
			notices.show('Не удалось сохранить изменения в браузере.', 'error');
			return false;
		}

		state.value = draft;
		notices.show(message, 'success');

		return true;
	};

	const create = (
		type: ContainerType | 'task',
		parentId: ParentId,
		name: string,
		description = '',
		position: 'before' | 'after' = 'after',
		subtasks: Subtask[] = [],
	): string | null => {
		const id = crypto.randomUUID();
		const success = commit((draft) => {
			const parent = getEntry(draft, parentId);
			if (
				type === 'task'
					? parent?.type !== 'checklist'
					: parentId !== null && parent?.type !== 'folder'
			)
				return false;
			const order = nextOrder(draft);
			if (type === 'task') {
				if (!name.trim() || subtasks.some((subtask) => !subtask.value.trim())) return false;
				draft.tasks.push({
					id,
					type,
					value: name.trim(),
					completed: false,
					status: 'pending',
					parentId,
					order,
					subtasks: subtasks.map((subtask) => ({ ...subtask, value: subtask.value.trim() })),
				});
				syncTaskStatus(draft.tasks.at(-1)!);
				if (position === 'before') {
					const first = draft.tasks
						.filter((task) => task.parentId === parentId && task.id !== id)
						.sort((a, b) => a.order - b.order)[0];
					if (first) placeEntries(draft, [id], parentId, first.id, 'before');
				}
			} else {
				const common = { id, parentId, order, name: name.trim() || formatFolderName() };
				if (type === 'folder') draft.folders.push({ ...common, type });
				if (type === 'checklist') draft.checklists.push({ ...common, type });
				if (type === 'note') draft.notes.push({ ...common, type, description });
			}

			return true;
		}, 'Элемент создан.');

		return success ? id : null;
	};

	const update = (id: string, name: string, description = '', subtasks?: Subtask[]) => {
		return commit((draft) => {
			const entry = getEntry(draft, id);
			if (!entry || (entry.type === 'task' && !name.trim())) return false;
			if (entry.type === 'task') {
				if (subtasks?.some((subtask) => !subtask.value.trim())) return false;
				entry.value = name.trim();
				if (subtasks)
					entry.subtasks = subtasks.map((subtask) => ({ ...subtask, value: subtask.value.trim() }));
				syncTaskStatus(entry);
			} else entry.name = name.trim() || formatFolderName();
			if (entry.type === 'note') entry.description = description;

			return true;
		}, 'Изменения сохранены.');
	};

	const toggleTask = (id: string) => {
		return commit((draft) => {
			const task = getEntry(draft, id);
			if (task?.type !== 'task' || task.subtasks?.length) return false;
			advanceTaskStatus(task);

			return true;
		}, 'Статус задачи изменён.');
	};

	const toggleSubtask = (id: string, subtaskId: string) =>
		commit((draft) => {
			const task = getEntry(draft, id);
			if (task?.type !== 'task') return false;
			const subtask = task.subtasks?.find((item) => item.id === subtaskId);
			if (!subtask) return false;
			advanceTaskStatus(subtask);
			syncTaskStatus(task);
			return true;
		}, 'Статус подзадачи изменён.');

	const remove = (ids: string[]) =>
		commit((draft) => deleteEntries(draft, ids), 'Элементы удалены.');

	const move = (
		ids: string[],
		parentId: ParentId,
		referenceId: ParentId = null,
		position: 'before' | 'after' = 'after',
	) =>
		commit(
			(draft) => placeEntries(draft, ids, parentId, referenceId, position),
			'Элементы перемещены.',
		);

	const swap = (first: string, second: string) =>
		commit((draft) => swapEntries(draft, first, second), 'Элементы поменялись местами.');

	const entry = (id: ParentId): Entry | undefined => getEntry(state.value, id);
	const paste = (clipboard: EntryClipboard, parentId: ParentId) =>
		commit((draft) => pasteClipboard(draft, clipboard, parentId), 'Элементы скопированы.');

	return {
		state,
		initialized,
		initialize,
		create,
		update,
		toggleTask,
		toggleSubtask,
		remove,
		move,
		swap,
		entry,
		paste,
	};
});
