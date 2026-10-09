import type {
  Task,
  TaskStatus,
  Folder,
  Checklist,
  Note,
  NotesState,
  ParentId,
  StorageLike,
} from '@/types/notes';
import { formatFolderName } from '@/utils/format';
import { getEntry, allEntries } from '@/utils/entries';
interface LegacyEntry {
  id: string;
  value?: string;
  name?: string;
  description?: string;
  completed?: boolean;
  status?: TaskStatus;
  parentId?: ParentId;
  order?: number;
}
const taskStatuses: TaskStatus[] = ['pending', 'in-progress', 'completed'];
export function loadState(storage: StorageLike) {
  const read = (key: string): LegacyEntry[] => {
    try {
      const value = JSON.parse(storage.getItem(key) ?? '[]');
      return Array.isArray(value)
        ? value.filter((item) => item && typeof item === 'object' && typeof item.id === 'string')
        : [];
    } catch {
      return [];
    }
  };
  const tasks: Task[] = read('tasks')
    .filter((item) => item && typeof item.id === 'string')
    .map((item, index) => ({
      id: item.id,
      type: 'task',
      value: String(item.value ?? ''),
      completed: Boolean(item.completed),
      ...(item.status !== undefined && taskStatuses.includes(item.status)
        ? { status: item.status, completed: item.status === 'completed' }
        : {}),
      parentId: item.parentId ?? null,
      order: typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : index,
    }));
  const folders: Folder[] = read('todo-folders')
    .filter((item) => item && typeof item.id === 'string')
    .map((item, index) => ({
      id: item.id,
      type: 'folder',
      name: String(item.name ?? '').trim() || formatFolderName(),
      parentId: item.parentId ?? null,
      order:
        typeof item.order === 'number' && Number.isFinite(item.order)
          ? item.order
          : tasks.length + index,
    }));
  const checklists: Checklist[] = read('todo-checklists')
    .filter((item) => item && typeof item.id === 'string')
    .map((item, index) => ({
      id: item.id,
      type: 'checklist',
      name: String(item.name ?? '').trim() || formatFolderName(),
      parentId: item.parentId ?? null,
      order:
        typeof item.order === 'number' && Number.isFinite(item.order)
          ? item.order
          : tasks.length + folders.length + index,
    }));
  const notes: Note[] = read('todo-notes')
    .filter((item) => item && typeof item.id === 'string')
    .map((item, index) => ({
      id: item.id,
      type: 'note',
      name: String(item.name ?? '').trim() || formatFolderName(),
      description: String(item.description ?? ''),
      parentId: item.parentId ?? null,
      order:
        typeof item.order === 'number' && Number.isFinite(item.order)
          ? item.order
          : tasks.length + folders.length + checklists.length + index,
    }));
  const state: NotesState = { tasks, folders, checklists, notes };
  const folderIds = new Set(folders.map((folder) => folder.id));
  [...folders, ...checklists, ...notes].forEach((item) => {
    if (!(item.parentId !== null && folderIds.has(item.parentId)) || item.parentId === item.id)
      item.parentId = null;
  });
  folders.forEach((folder) => {
    const seen = new Set([folder.id]);
    let parent = getEntry(state, folder.parentId);
    while (parent) {
      if (seen.has(parent.id)) {
        folder.parentId = null;
        break;
      }
      seen.add(parent.id);
      parent = getEntry(state, parent.parentId);
    }
  });
  // Старые задачи группируются по прежнему разделу без изменения текста, статуса и порядка.
  const checklistIds = new Set(checklists.map((item) => item.id));
  const legacyGroups = new Map<ParentId, Checklist>();
  const usedIds = new Set(allEntries(state).map((item) => item.id));
  tasks.forEach((task) => {
    if (task.parentId !== null && checklistIds.has(task.parentId)) return;
    const parentId = task.parentId !== null && folderIds.has(task.parentId) ? task.parentId : null;
    let checklist = legacyGroups.get(parentId);
    if (!checklist) {
      let id = `legacy-checklist-${parentId ?? 'root'}`;
      while (usedIds.has(id)) id += '-1';
      usedIds.add(id);
      checklist = { id, type: 'checklist', name: 'Задачи', parentId, order: task.order };
      checklists.push(checklist);
      legacyGroups.set(parentId, checklist);
    }
    checklist.order = Math.min(checklist.order, task.order);
    task.parentId = checklist.id;
  });
  return state;
}

export function saveState(state: NotesState, storage: StorageLike) {
  storage.setItem('tasks', JSON.stringify(state.tasks));
  storage.setItem('todo-folders', JSON.stringify(state.folders));
  storage.setItem('todo-checklists', JSON.stringify(state.checklists));
  storage.setItem('todo-notes', JSON.stringify(state.notes ?? []));
}
