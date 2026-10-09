import type { Entry, NotesState, ParentId } from '@/types/notes';
import { getTaskStatus } from './taskStatus';
export const allEntries = (state: NotesState): Entry[] => [
  ...state.tasks,
  ...state.folders,
  ...state.checklists,
  ...(state.notes ?? []),
];
export const getEntry = (state: NotesState, id: ParentId): Entry | undefined =>
  state.tasks.find((item) => item.id === id) ??
  state.folders.find((item) => item.id === id) ??
  state.checklists.find((item) => item.id === id) ??
  state.notes.find((item) => item.id === id);
export const nextOrder = (state: NotesState) =>
  allEntries(state).reduce((max, item) => Math.max(max, item.order), -1) + 1;
export const getChildren = (state: NotesState, parentId: ParentId) =>
  allEntries(state)
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.order - b.order);

export function descendantContainerIds(state: NotesState, id: ParentId) {
  const ids = new Set([id]);
  const pending = [id];
  while (pending.length) {
    const parentId = pending.pop();
    [...state.folders, ...state.checklists, ...(state.notes ?? [])]
      .filter((folder) => folder.parentId === parentId && !ids.has(folder.id))
      .forEach((folder) => {
        ids.add(folder.id);
        pending.push(folder.id);
      });
  }
  return ids;
}

export function getChecklistStats(state: NotesState, id: ParentId) {
  const tasks = state.tasks.filter((task) => task.parentId === id);
  const completed = tasks.filter((task) => getTaskStatus(task) === 'completed').length;
  const started = tasks.some((task) => getTaskStatus(task) === 'in-progress');
  return {
    total: tasks.length,
    completed,
    status:
      completed === 0 && !started ? 'empty' : completed === tasks.length ? 'complete' : 'partial',
  };
}

export function canPlaceEntry(state: NotesState, id: string, parentId: ParentId) {
  const entry = getEntry(state, id);
  if (!entry) return false;
  const parent = getEntry(state, parentId);
  if (entry.type === 'task') return parent?.type === 'checklist';
  if (parentId !== null && parent?.type !== 'folder') return false;
  if (entry.type === 'folder' && descendantContainerIds(state, id).has(parentId)) return false;
  return true;
}

export const canMoveEntry = (state: NotesState, id: string, parentId: ParentId) =>
  canPlaceEntry(state, id, parentId) && getEntry(state, id)!.parentId !== parentId;

export function placeEntry(
  state: NotesState,
  id: string,
  parentId: ParentId,
  referenceId: ParentId = null,
  position: 'before' | 'after' = 'before',
) {
  if (!canPlaceEntry(state, id, parentId) || !['before', 'after'].includes(position)) return false;
  const entry = getEntry(state, id)!;
  const siblings = getChildren(state, parentId).filter((item) => item.id !== id);
  const referenceIndex =
    referenceId === null ? siblings.length : siblings.findIndex((item) => item.id === referenceId);
  if (referenceIndex < 0) return false;
  const index = referenceId !== null && position === 'after' ? referenceIndex + 1 : referenceIndex;
  siblings.splice(index, 0, entry);
  const previous = getChildren(state, parentId);
  if (
    entry.parentId === parentId &&
    previous.every((item, order) => item.id === siblings[order].id)
  )
    return false;
  entry.parentId = parentId;
  siblings.forEach((item, order) => {
    item.order = order;
  });
  return true;
}

export function moveEntry(state: NotesState, id: string, parentId: ParentId) {
  if (!canMoveEntry(state, id, parentId)) return false;
  const entry = getEntry(state, id)!;
  entry.parentId = parentId;
  entry.order = nextOrder(state);
  return true;
}

export function canSwapTasks(state: NotesState, id: string, otherId: string) {
  const entry = getEntry(state, id),
    other = getEntry(state, otherId);
  return (
    id !== otherId &&
    entry?.type === 'task' &&
    other?.type === 'task' &&
    canPlaceEntry(state, id, other.parentId) &&
    canPlaceEntry(state, otherId, entry.parentId)
  );
}

export function swapTasks(state: NotesState, id: string, otherId: string) {
  if (!canSwapTasks(state, id, otherId)) return false;
  const entry = getEntry(state, id)!,
    other = getEntry(state, otherId)!;
  // Меняем ровно две позиции; все промежуточные задачи остаются на своих местах.
  const groups = [...new Set([entry.parentId, other.parentId])].map((parentId) => ({
    parentId,
    items: getChildren(state, parentId).map((item) =>
      item.id === id ? other : item.id === otherId ? entry : item,
    ),
  }));
  groups.forEach(({ parentId, items }) =>
    items.forEach((item, order) => {
      item.parentId = parentId;
      item.order = order;
    }),
  );
  return true;
}

export function canSwapEntries(state: NotesState, id: string, otherId: string) {
  const entry = getEntry(state, id),
    other = getEntry(state, otherId);
  return (
    id !== otherId &&
    !!entry &&
    !!other &&
    canPlaceEntry(state, id, other.parentId) &&
    canPlaceEntry(state, otherId, entry.parentId)
  );
}

export function swapEntries(state: NotesState, id: string, otherId: string) {
  if (!canSwapEntries(state, id, otherId)) return false;
  const entry = getEntry(state, id)!,
    other = getEntry(state, otherId)!;
  const groups = [...new Set([entry.parentId, other.parentId])].map((parentId) => ({
    parentId,
    items: getChildren(state, parentId).map((item) =>
      item.id === id ? other : item.id === otherId ? entry : item,
    ),
  }));
  groups.forEach(({ parentId, items }) =>
    items.forEach((item, order) => {
      item.parentId = parentId;
      item.order = order;
    }),
  );
  return true;
}

export function canPlaceEntries(state: NotesState, ids: string[], parentId: ParentId) {
  return (
    ids.length > 0 &&
    new Set(ids).size === ids.length &&
    ids.every((id) => canPlaceEntry(state, id, parentId))
  );
}

export function placeEntries(
  state: NotesState,
  ids: string[],
  parentId: ParentId,
  referenceId: ParentId = null,
  position: 'before' | 'after' = 'before',
) {
  if (
    !canPlaceEntries(state, ids, parentId) ||
    !['before', 'after'].includes(position) ||
    (referenceId !== null && ids.includes(referenceId))
  )
    return false;
  const selected = new Set(ids);
  // Не допускаем одновременный перенос контейнера и его потомка.
  if (
    ids.some((id) =>
      ids.some(
        (other) =>
          id !== other && descendantContainerIds(state, id).has(getEntry(state, other)!.parentId),
      ),
    )
  )
    return false;
  const items = ids.map((id) => getEntry(state, id)!);
  const siblings = getChildren(state, parentId).filter((item) => !selected.has(item.id));
  const referenceIndex =
    referenceId === null ? siblings.length : siblings.findIndex((item) => item.id === referenceId);
  if (referenceIndex < 0) return false;
  siblings.splice(
    referenceIndex + (referenceId !== null && position === 'after' ? 1 : 0),
    0,
    ...items,
  );
  const previous = getChildren(state, parentId);
  if (
    items.every((item) => item.parentId === parentId) &&
    previous.every((item, index) => item.id === siblings[index]?.id)
  )
    return false;
  siblings.forEach((item, order) => {
    item.parentId = parentId;
    item.order = order;
  });
  return true;
}

export function deleteEntries(state: NotesState, ids: string[]) {
  if (!ids.length || !ids.every((id) => getEntry(state, id))) return false;
  const removed = new Set<ParentId>(ids);
  ids.forEach((id) => descendantContainerIds(state, id).forEach((child) => removed.add(child)));
  state.tasks = state.tasks.filter(
    (item) => !removed.has(item.id) && (item.parentId === null || !removed.has(item.parentId)),
  );
  state.folders = state.folders.filter((item) => !removed.has(item.id));
  state.checklists = state.checklists.filter((item) => !removed.has(item.id));
  state.notes = (state.notes ?? []).filter((item) => !removed.has(item.id));
  return true;
}

export function deleteContainer(state: NotesState, id: ParentId) {
  if (!getEntry(state, id) || getEntry(state, id)!.type === 'task') return false;
  const ids = descendantContainerIds(state, id);
  state.tasks = state.tasks.filter((task) => !ids.has(task.parentId));
  state.folders = state.folders.filter((folder) => !ids.has(folder.id));
  state.checklists = state.checklists.filter((item) => !ids.has(item.id));
  state.notes = (state.notes ?? []).filter((item) => !ids.has(item.id));
  return true;
}

export function clearContainer(state: NotesState, id: ParentId) {
  if (!['folder', 'checklist'].includes(getEntry(state, id)?.type ?? '')) return false;
  const ids = descendantContainerIds(state, id);
  state.tasks = state.tasks.filter((task) => !ids.has(task.parentId));
  state.folders = state.folders.filter((folder) => folder.id === id || !ids.has(folder.id));
  state.checklists = state.checklists.filter((item) => item.id === id || !ids.has(item.id));
  state.notes = (state.notes ?? []).filter((item) => !ids.has(item.id));
  return true;
}
