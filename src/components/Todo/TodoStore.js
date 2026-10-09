export function formatFolderName(date = new Date()) {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('day')}.${value('month')}.${value('year')} в ${value('hour')}:${value('minute')}`;
}

const taskStatuses = ['pending', 'in-progress', 'completed'];
export const getTaskStatus = task => taskStatuses.includes(task.status) ? task.status : task.completed ? 'completed' : 'pending';
export function advanceTaskStatus(task) {
  task.status = taskStatuses[(taskStatuses.indexOf(getTaskStatus(task)) + 1) % taskStatuses.length];
  task.completed = task.status === 'completed';
  return task.status;
}

export function loadState(storage) {
  const read = key => {
    try {
      const value = JSON.parse(storage.getItem(key) ?? '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const tasks = read('tasks').filter(item => item && typeof item.id === 'string').map((item, index) => ({
    id: item.id, type: 'task', value: String(item.value ?? ''), completed: Boolean(item.completed),
    ...(taskStatuses.includes(item.status) ? { status: item.status, completed: item.status === 'completed' } : {}),
    parentId: item.parentId ?? null, order: Number.isFinite(item.order) ? item.order : index,
  }));
  const folders = read('todo-folders').filter(item => item && typeof item.id === 'string').map((item, index) => ({
    id: item.id, type: 'folder', name: String(item.name ?? '').trim() || formatFolderName(),
    parentId: item.parentId ?? null, order: Number.isFinite(item.order) ? item.order : tasks.length + index,
  }));
  const checklists = read('todo-checklists').filter(item => item && typeof item.id === 'string').map((item, index) => ({
    id: item.id, type: 'checklist', name: String(item.name ?? '').trim() || formatFolderName(),
    parentId: item.parentId ?? null, order: Number.isFinite(item.order) ? item.order : tasks.length + folders.length + index,
  }));
  const notes = read('todo-notes').filter(item => item && typeof item.id === 'string').map((item, index) => ({
    id: item.id, type: 'note', name: String(item.name ?? '').trim() || formatFolderName(),
    description: String(item.description ?? ''), parentId: item.parentId ?? null,
    order: Number.isFinite(item.order) ? item.order : tasks.length + folders.length + checklists.length + index,
  }));
  const state = { tasks, folders, checklists, notes };
  const folderIds = new Set(folders.map(folder => folder.id));
  [...folders, ...checklists, ...notes].forEach(item => {
    if (!folderIds.has(item.parentId) || item.parentId === item.id) item.parentId = null;
  });
  folders.forEach(folder => {
    const seen = new Set([folder.id]);
    let parent = getEntry(state, folder.parentId);
    while (parent) {
      if (seen.has(parent.id)) { folder.parentId = null; break; }
      seen.add(parent.id);
      parent = getEntry(state, parent.parentId);
    }
  });
  // Старые задачи группируются по прежнему разделу без изменения текста, статуса и порядка.
  const checklistIds = new Set(checklists.map(item => item.id));
  const legacyGroups = new Map();
  const usedIds = new Set(allEntries(state).map(item => item.id));
  tasks.forEach(task => {
    if (checklistIds.has(task.parentId)) return;
    const parentId = folderIds.has(task.parentId) ? task.parentId : null;
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

export function saveState(state, storage) {
  storage.setItem('tasks', JSON.stringify(state.tasks));
  storage.setItem('todo-folders', JSON.stringify(state.folders));
  storage.setItem('todo-checklists', JSON.stringify(state.checklists));
  storage.setItem('todo-notes', JSON.stringify(state.notes ?? []));
}

export const allEntries = state => [...state.tasks, ...state.folders, ...state.checklists, ...(state.notes ?? [])];
export const getEntry = (state, id) => allEntries(state).find(item => item.id === id);
export const nextOrder = state => Math.max(-1, ...allEntries(state).map(item => item.order)) + 1;
export const getChildren = (state, parentId) => allEntries(state)
  .filter(item => item.parentId === parentId).sort((a, b) => a.order - b.order);

export function descendantContainerIds(state, id) {
  const ids = new Set([id]);
  const pending = [id];
  while (pending.length) {
    const parentId = pending.pop();
    [...state.folders, ...state.checklists, ...(state.notes ?? [])].filter(folder => folder.parentId === parentId && !ids.has(folder.id)).forEach(folder => {
      ids.add(folder.id);
      pending.push(folder.id);
    });
  }
  return ids;
}

export function getChecklistStats(state, id) {
  const tasks = state.tasks.filter(task => task.parentId === id);
  const completed = tasks.filter(task => getTaskStatus(task) === 'completed').length;
  const started = tasks.some(task => getTaskStatus(task) === 'in-progress');
  return { total: tasks.length, completed, status: completed === 0 && !started ? 'empty' : completed === tasks.length ? 'complete' : 'partial' };
}

export function canPlaceEntry(state, id, parentId) {
  const entry = getEntry(state, id);
  if (!entry) return false;
  const parent = getEntry(state, parentId);
  if (entry.type === 'task') return parent?.type === 'checklist';
  if (parentId !== null && parent?.type !== 'folder') return false;
  if (entry.type === 'folder' && descendantContainerIds(state, id).has(parentId)) return false;
  return true;
}

export const canMoveEntry = (state, id, parentId) => canPlaceEntry(state, id, parentId)
  && getEntry(state, id).parentId !== parentId;

export function placeEntry(state, id, parentId, referenceId = null, position = 'before') {
  if (!canPlaceEntry(state, id, parentId) || !['before', 'after'].includes(position)) return false;
  const entry = getEntry(state, id);
  const siblings = getChildren(state, parentId).filter(item => item.id !== id);
  const referenceIndex = referenceId === null ? siblings.length : siblings.findIndex(item => item.id === referenceId);
  if (referenceIndex < 0) return false;
  const index = referenceId !== null && position === 'after' ? referenceIndex + 1 : referenceIndex;
  siblings.splice(index, 0, entry);
  const previous = getChildren(state, parentId);
  if (entry.parentId === parentId && previous.every((item, order) => item.id === siblings[order].id)) return false;
  entry.parentId = parentId;
  siblings.forEach((item, order) => { item.order = order; });
  return true;
}

export function moveEntry(state, id, parentId) {
  if (!canMoveEntry(state, id, parentId)) return false;
  const entry = getEntry(state, id);
  entry.parentId = parentId;
  entry.order = nextOrder(state);
  return true;
}

export function canSwapTasks(state, id, otherId) {
  const entry = getEntry(state, id), other = getEntry(state, otherId);
  return id !== otherId && entry?.type === 'task' && other?.type === 'task'
    && canPlaceEntry(state, id, other.parentId) && canPlaceEntry(state, otherId, entry.parentId);
}

export function swapTasks(state, id, otherId) {
  if (!canSwapTasks(state, id, otherId)) return false;
  const entry = getEntry(state, id), other = getEntry(state, otherId);
  // Меняем ровно две позиции; все промежуточные задачи остаются на своих местах.
  const groups = [...new Set([entry.parentId, other.parentId])].map(parentId => ({
    parentId, items: getChildren(state, parentId).map(item => item.id === id ? other : item.id === otherId ? entry : item),
  }));
  groups.forEach(({ parentId, items }) => items.forEach((item, order) => { item.parentId = parentId; item.order = order; }));
  return true;
}

export function canSwapEntries(state, id, otherId) {
  const entry = getEntry(state, id), other = getEntry(state, otherId);
  return id !== otherId && Boolean(entry && other)
    && canPlaceEntry(state, id, other.parentId) && canPlaceEntry(state, otherId, entry.parentId);
}

export function swapEntries(state, id, otherId) {
  if (!canSwapEntries(state, id, otherId)) return false;
  const entry = getEntry(state, id), other = getEntry(state, otherId);
  const groups = [...new Set([entry.parentId, other.parentId])].map(parentId => ({
    parentId, items: getChildren(state, parentId).map(item => item.id === id ? other : item.id === otherId ? entry : item),
  }));
  groups.forEach(({ parentId, items }) => items.forEach((item, order) => { item.parentId = parentId; item.order = order; }));
  return true;
}

export function canPlaceEntries(state, ids, parentId) {
  return ids.length > 0 && new Set(ids).size === ids.length && ids.every(id => canPlaceEntry(state, id, parentId));
}

export function placeEntries(state, ids, parentId, referenceId = null, position = 'before') {
  if (!canPlaceEntries(state, ids, parentId) || !['before', 'after'].includes(position) || ids.includes(referenceId)) return false;
  const selected = new Set(ids);
  // Не допускаем одновременный перенос контейнера и его потомка.
  if (ids.some(id => ids.some(other => id !== other && descendantContainerIds(state, id).has(getEntry(state, other).parentId)))) return false;
  const items = ids.map(id => getEntry(state, id));
  const siblings = getChildren(state, parentId).filter(item => !selected.has(item.id));
  const referenceIndex = referenceId === null ? siblings.length : siblings.findIndex(item => item.id === referenceId);
  if (referenceIndex < 0) return false;
  siblings.splice(referenceIndex + (referenceId !== null && position === 'after' ? 1 : 0), 0, ...items);
  const previous = getChildren(state, parentId);
  if (items.every(item => item.parentId === parentId) && previous.every((item, index) => item.id === siblings[index]?.id)) return false;
  siblings.forEach((item, order) => { item.parentId = parentId; item.order = order; });
  return true;
}

export function deleteEntries(state, ids) {
  if (!ids.length || !ids.every(id => getEntry(state, id))) return false;
  const removed = new Set(ids);
  ids.forEach(id => descendantContainerIds(state, id).forEach(child => removed.add(child)));
  state.tasks = state.tasks.filter(item => !removed.has(item.id) && !removed.has(item.parentId));
  state.folders = state.folders.filter(item => !removed.has(item.id));
  state.checklists = state.checklists.filter(item => !removed.has(item.id));
  state.notes = (state.notes ?? []).filter(item => !removed.has(item.id));
  return true;
}

export function deleteContainer(state, id) {
  if (!getEntry(state, id) || getEntry(state, id).type === 'task') return false;
  const ids = descendantContainerIds(state, id);
  state.tasks = state.tasks.filter(task => !ids.has(task.parentId));
  state.folders = state.folders.filter(folder => !ids.has(folder.id));
  state.checklists = state.checklists.filter(item => !ids.has(item.id));
  state.notes = (state.notes ?? []).filter(item => !ids.has(item.id));
  return true;
}

export function clearContainer(state, id) {
  if (!['folder', 'checklist'].includes(getEntry(state, id)?.type)) return false;
  const ids = descendantContainerIds(state, id);
  state.tasks = state.tasks.filter(task => !ids.has(task.parentId));
  state.folders = state.folders.filter(folder => folder.id === id || !ids.has(folder.id));
  state.checklists = state.checklists.filter(item => item.id === id || !ids.has(item.id));
  state.notes = (state.notes ?? []).filter(item => !ids.has(item.id));
  return true;
}
