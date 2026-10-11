import type {
	BaseEntry,
	ContainerType,
	NotesState,
	Subtask,
	Task,
	TaskStatus,
} from '@/types/notes';
import { syncTaskStatus } from '@/utils/taskStatus';

const createEmptyState = (): NotesState => ({ tasks: [], folders: [], checklists: [], notes: [] });

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isEntry = (value: unknown): value is BaseEntry & Record<string, unknown> =>
	isRecord(value) &&
	typeof value.id === 'string' &&
	value.id.trim().length > 0 &&
	(value.parentId === null || typeof value.parentId === 'string') &&
	typeof value.order === 'number' &&
	Number.isFinite(value.order);

const normalizeState = (value: unknown): NotesState => {
	const state = createEmptyState();
	if (
		!isRecord(value) ||
		!['tasks', 'folders', 'checklists', 'notes'].every((key) => Array.isArray(value[key]))
	)
		return state;

	const usedIds = new Set<string>();

	const read = (key: keyof NotesState, type: ContainerType | 'task') =>
		(value[key] as unknown[]).filter((item): item is BaseEntry & Record<string, unknown> => {
			if (!isEntry(item) || item.type !== type || usedIds.has(item.id)) return false;
			const valid =
				type === 'task'
					? typeof item.value === 'string' &&
						typeof item.status === 'string' &&
						['pending', 'in-progress', 'completed'].includes(item.status)
					: typeof item.name === 'string' &&
						(type !== 'note' || typeof item.description === 'string');
			if (valid) usedIds.add(item.id);
			return valid;
		});

	const base = (item: BaseEntry): BaseEntry => ({
		id: item.id,
		parentId: item.parentId,
		order: item.order,
	});

	state.folders = read('folders', 'folder').map((item) => ({
		...base(item),
		type: 'folder',
		name: item.name as string,
	}));

	state.checklists = read('checklists', 'checklist').map((item) => ({
		...base(item),
		type: 'checklist',
		name: item.name as string,
	}));

	state.notes = read('notes', 'note').map((item) => ({
		...base(item),
		type: 'note',
		name: item.name as string,
		description: item.description as string,
	}));

	state.tasks = read('tasks', 'task').map((item) => {
		const task: Task = {
			...base(item),
			type: 'task',
			value: item.value as string,
			status: item.status as TaskStatus,
			completed: item.status === 'completed',
		};
		if (Array.isArray(item.subtasks)) {
			task.subtasks = item.subtasks.flatMap((subtask): Subtask[] => {
				if (
					!isRecord(subtask) ||
					typeof subtask.id !== 'string' ||
					!subtask.id.trim() ||
					usedIds.has(subtask.id) ||
					typeof subtask.value !== 'string' ||
					!subtask.value.trim() ||
					!['pending', 'in-progress', 'completed'].includes(subtask.status as string)
				)
					return [];
				usedIds.add(subtask.id);
				return [
					{
						id: subtask.id,
						value: subtask.value,
						status: subtask.status as TaskStatus,
						completed: subtask.status === 'completed',
					},
				];
			});
		}
		syncTaskStatus(task);
		return task;
	});

	const folders = new Map(state.folders.map((folder) => [folder.id, folder]));

	for (const entry of [...state.folders, ...state.checklists, ...state.notes]) {
		if (entry.parentId === entry.id || (entry.parentId !== null && !folders.has(entry.parentId)))
			entry.parentId = null;
	}

	for (const folder of state.folders) {
		const seen = new Set([folder.id]);
		let parent = folder.parentId;
		while (parent !== null) {
			if (seen.has(parent)) {
				folder.parentId = null;
				break;
			}
			seen.add(parent);
			parent = folders.get(parent)?.parentId ?? null;
		}
	}

	const checklistIds = new Set(state.checklists.map((checklist) => checklist.id));
	state.tasks = state.tasks.filter(
		(task) => task.parentId !== null && checklistIds.has(task.parentId),
	);

	return state;
};

export { createEmptyState, normalizeState };
