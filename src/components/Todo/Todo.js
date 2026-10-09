import './Todo.css';
import './Item.css';
import './Checkbox.css';
import './Modal.css';
import './Folder.css';
import './Note.css';
import '../Input/Input.css';
import { Button } from '@/components/Button/Button';
import IconFolder from '@/assets/icons/IconFolder';
import IconTasks from '@/assets/icons/IconTasks';
import IconText from '@/assets/icons/IconText';
import IconHome from '@/assets/icons/IconHome';
import IconMenu from '@/assets/icons/IconMenu';
import IconTaskStatus from '@/assets/icons/IconTaskStatus';
import { loadState, saveState, formatFolderName, getEntry, getChildren, nextOrder, getTaskStatus, advanceTaskStatus,
  allEntries, descendantContainerIds, getChecklistStats, canPlaceEntries, canSwapEntries, swapEntries, placeEntries, deleteEntries, deleteContainer } from './TodoStore';
import { initDragAndDrop } from './DragAndDrop';
import { showMenu, hideMenu } from './MenuAnimation';
import { initWorkspaceControls } from './WorkspaceControls';
import { initAutoResizeTextareas } from '../Input/AutoResizeTextarea';
import { createNotice } from '../Notice/Notice';

const taskCount = count => `${count} ${count % 100 >= 11 && count % 100 <= 14 ? 'задач'
  : count % 10 === 1 ? 'задача' : count % 10 >= 2 && count % 10 <= 4 ? 'задачи' : 'задач'}`;
const elementCount = count => `${count} ${count % 100 >= 11 && count % 100 <= 14 ? 'элементов'
  : count % 10 === 1 ? 'элемент' : count % 10 >= 2 && count % 10 <= 4 ? 'элемента' : 'элементов'}`;
const containerNoun = entry => entry.type === 'note' ? 'заметку' : entry.type === 'checklist' ? 'перечень' : 'папку';
const containerGenitive = entry => entry.type === 'note' ? 'заметки' : entry.type === 'checklist' ? 'перечня' : 'папки';
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const iconVerticalDots = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="4" r="1.5" fill="currentColor"/><circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="16" r="1.5" fill="currentColor"/></svg>';
const iconBurger = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
const iconPlus = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

export function Todo() {
  const state = loadState(localStorage);
  const layoutStorageKey = 'todo-layout';
  let layout = '1';
  let currentContainerId = null;
  try {
    const savedLayout = localStorage.getItem(layoutStorageKey);
    if (['1', '2', '3'].includes(savedLayout)) layout = savedLayout;
    const savedFolder = localStorage.getItem('todo-current-folder');
    if (getEntry(state, savedFolder)?.type && getEntry(state, savedFolder).type !== 'task') currentContainerId = savedFolder;
  } catch { /* Открываем список, если хранилище недоступно. */ }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('todo');
    const list = root.querySelector('.todo__list');
    const count = root.querySelector('.todo__count-value');
    const emptyMessage = root.querySelector('.todo__list-empty');
    const breadcrumbs = root.querySelector('.todo__breadcrumbs');
    const contextOptions = root.querySelector('.todo__context-options');
    const addModal = root.querySelector('#todo-add-modal');
    const noteView = root.querySelector('.todo__note-view');
    const noteEditor = noteView.querySelector('form');
    const noteReader = noteView.querySelector('.note-reader');
    const notices = createNotice();
    const deleteModal = root.querySelector('#todo-modal');
    const folderModal = root.querySelector('#todo-folder-modal');
    const taskModal = root.querySelector('#todo-task-modal');
    const noteModal = root.querySelector('#todo-note-modal');
    const noteForm = noteModal.querySelector('form');
    const taskForm = taskModal.querySelector('form');
    const folderForm = folderModal.querySelector('form');
    const folderName = folderForm.elements.folderName;
    const noteTextareas = initAutoResizeTextareas(root, 'textarea[data-autoresize]');
    let taskBeingEdited = null;
    let taskInsertPosition = 'after';
    let containerBeingRenamed = null;
    let containerBeingCreated = 'folder';
    let pendingDelete = null;
    let openMenu = null;
    let menuTrigger = null;
    let layoutFrame = null;
    let controls = null;
    let noteEditing = false;
    const closeTimers = new WeakMap();
    const taskExpandAnimations = new WeakMap();

    const showNotice = message => notices.info(message);
    const persist = successMessage => {
      try {
        saveState(state, localStorage);
        if (successMessage) notices.success(successMessage);
        return true;
      }
      catch { notices.error('Не удалось сохранить изменения в браузере.'); return false; }
    };
    // Сохраняем в том числе перенос старых задач в перечни.
    persist();
    const containerIcon = (entry, isOpen = false) => entry.type === 'note' ? IconText() : entry.type === 'checklist' ? IconTasks(getChecklistStats(state, entry.id).status)
      : IconFolder(isOpen, getChildren(state, entry.id).length === 0);
    const pathIcon = entry => entry.type === 'folder'
      ? IconFolder(true, entry.id === currentContainerId && getChildren(state, entry.id).length === 0)
      : containerIcon(entry, true);

    // В каждой колонке карточки идут независимо, с сохранением порядка слева направо.
    const updateCardLayout = () => {
      list.querySelectorAll('.task').forEach(card => {
        const text = card.querySelector('.task__text');
        const lineHeight = parseFloat(getComputedStyle(text).lineHeight);
        card.classList.toggle('is-single-line', text.scrollHeight <= lineHeight + 1);
        const clipped = text.scrollHeight > 40;
        text.classList.toggle('is-clipped', clipped && !card.classList.contains('is-expanded'));
        card.querySelector('.task__expand').hidden = !clipped;
      });
      list.querySelectorAll('.folder__count').forEach(summary => summary.classList.toggle('is-clipped', summary.scrollHeight > summary.clientHeight + 1));
      if (list.classList.contains('--hide') || list.dataset.layout === '1') return;
      const styles = getComputedStyle(list);
      const columns = Number(styles.getPropertyValue('--columns'));
      const cards = [...list.children];
      cards.forEach((card, index) => card.style.setProperty('--card-column', String(index % columns + 1)));
      const gap = parseFloat(styles.columnGap);
      const spans = cards.map(card => Math.ceil(card.getBoundingClientRect().height + gap));
      cards.forEach((card, index) => card.style.setProperty('--card-row-span', String(spans[index])));
    };
    const queueCardLayout = () => {
      if (layoutFrame !== null) return;
      layoutFrame = requestAnimationFrame(() => { layoutFrame = null; updateCardLayout(); });
    };
    const resizeObserver = new ResizeObserver(queueCardLayout);
    resizeObserver.observe(list);
    const clearList = () => {
      [...list.children].forEach(card => resizeObserver.unobserve(card));
      list.replaceChildren();
    };

    const closeMenus = (restoreFocus = false) => {
      if (!openMenu) return;
      const owner = openMenu.closest('.todo__item, .todo__menu-container');
      hideMenu(openMenu, { onHidden: () => owner.classList.remove('has-open-menu') });
      menuTrigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) menuTrigger.focus();
      openMenu = null;
      menuTrigger = null;
    };
    const closeDialog = dialog => {
      clearTimeout(closeTimers.get(dialog));
      dialog.classList.add('close');
      const duration = getComputedStyle(dialog).animationDuration;
      const durationMs = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
      closeTimers.set(dialog, setTimeout(() => dialog.close(), durationMs || 0));
    };
    const openDialog = dialog => {
      closeMenus();
      clearTimeout(closeTimers.get(dialog));
      dialog.classList.remove('close');
      dialog.showModal();
    };

    const renderContainerOptions = (folder, inToolbar = false) => {
      const options = element('button', `button folder__options${inToolbar ? ' todo__menu-trigger' : ''}`);
      options.type = 'button';
      options.innerHTML = inToolbar ? iconBurger : iconVerticalDots;
      options.setAttribute('aria-label', `Действия ${containerGenitive(folder)} «${folder.name}»`);
      options.setAttribute('aria-haspopup', 'menu');
      options.setAttribute('aria-expanded', 'false');
      const menu = element('div', `folder__menu${inToolbar ? ' todo__toolbar-menu' : ''}`);
      menu.id = `folder-menu-${folder.id}`;
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', `Действия ${containerGenitive(folder)} «${folder.name}»`);
      menu.hidden = true;
      options.setAttribute('aria-controls', menu.id);
      const actions = [folder.type === 'note' ? ['edit-note', 'Изменить'] : ['rename', folder.type === 'checklist' && inToolbar ? 'Переименовать' : 'Изменить'], ['delete', `Удалить ${containerNoun(folder)}`]];
      if (!inToolbar) actions.unshift(['open', 'Открыть']);
      actions.forEach(([action, label]) => {
        const button = element('button', `folder__menu-action${action === 'delete' ? ' is-danger' : ''}`, label);
        button.type = 'button';
        button.dataset.folderAction = action;
        button.dataset.folderId = folder.id;
        button.setAttribute('role', 'menuitem');
        menu.append(button);
      });
      return [options, menu];
    };

    const renderContextOptions = () => {
      contextOptions.replaceChildren();
      if (currentContainerId) {
        contextOptions.append(...renderContainerOptions(getEntry(state, currentContainerId), true));
        return;
      }
      const options = element('button', 'button todo__menu-trigger');
      options.type = 'button';
      options.innerHTML = iconBurger;
      options.title = 'Опции списка';
      options.setAttribute('aria-label', 'Опции списка');
      options.setAttribute('aria-haspopup', 'menu');
      options.setAttribute('aria-expanded', 'false');
      options.setAttribute('aria-controls', 'todo-options-menu');
      const menu = element('div', 'folder__menu todo__toolbar-menu');
      menu.id = 'todo-options-menu';
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', 'Опции списка');
      menu.hidden = true;
      [['add', 'Добавить'], ['search', 'Поиск'], ['view', 'Вид']].forEach(([action, label]) => {
        const button = element('button', 'folder__menu-action', label);
        button.type = 'button';
        button.dataset.toolbarAction = action;
        button.setAttribute('role', 'menuitem');
        menu.append(button);
      });
      contextOptions.append(options, menu);
    };

    const renderContainer = folder => {
      const card = element('li', `item folder todo__item${folder.type === 'checklist' ? ' checklist' : folder.type === 'note' ? ' note' : ''}`);
      card.dataset.id = folder.id;
      if (folder.type !== 'note') card.dataset.dropFolder = folder.id;
      if (folder.type === 'checklist') card.dataset.status = getChecklistStats(state, folder.id).status;
      const open = element('button', 'folder__open');
      open.type = 'button';
      open.dataset.folderAction = 'open';
      const icon = element('span', 'folder__icon');
      icon.innerHTML = containerIcon(folder);
      const text = element('span', 'folder__text');
      text.append(element('span', 'folder__title', folder.name), element('span', 'folder__count'));
      open.append(icon, text);
      card.append(open, ...renderContainerOptions(folder));
      return card;
    };

    const updateContainerCards = () => {
      root.querySelectorAll('.folder').forEach(card => {
        const folder = getEntry(state, card.dataset.id);
        if (!folder) return;
        const stats = folder.type === 'checklist' ? getChecklistStats(state, folder.id) : null;
        if (stats) card.dataset.status = stats.status;
        const summary = folder.type === 'note' ? (folder.description || 'Нет описания')
          : stats ? `${taskCount(stats.total)}${stats.total ? ` · Выполнено ${stats.completed}/${stats.total}` : ''}`
          : elementCount(getChildren(state, folder.id).length);
        card.querySelector('.folder__count').textContent = summary;
        card.querySelector('.folder__icon').innerHTML = containerIcon(folder);
        card.querySelector('.folder__open').setAttribute('aria-label', `Открыть ${containerNoun(folder)} «${folder.name}»${folder.type === 'note' ? '' : `, ${summary}`}`);
      });
      const total = getChildren(state, currentContainerId).length;
      count.replaceChildren(document.createTextNode('Элементов: '), element('span', '', String(total)));
      const isNote = getEntry(state, currentContainerId)?.type === 'note';
      root.querySelector('.todo__count').classList.toggle('--hide', isNote);
      breadcrumbs.querySelectorAll('.todo__path-icon').forEach(icon => {
        const entry = getEntry(state, icon.closest('button').dataset.navigateFolder);
        icon.innerHTML = entry ? pathIcon(entry) : IconHome();
        if (entry?.type === 'checklist') icon.closest('button').dataset.status = getChecklistStats(state, entry.id).status;
      });
    };

    const updateTaskAppearance = (card, task) => {
      const status = getTaskStatus(task);
      const labels = { pending: 'Без статуса', 'in-progress': 'В процессе', completed: 'Выполнено' };
      card.dataset.status = status;
      card.dataset.completed = String(status === 'completed');
      card.querySelector('.task__check').innerHTML = IconTaskStatus(status);
      const toggle = card.querySelector('.task__toggle');
      toggle.setAttribute('aria-pressed', status === 'in-progress' ? 'mixed' : String(status === 'completed'));
      toggle.setAttribute('aria-label', `${task.value}. Статус: ${labels[status]}. Изменить статус задачи`);
    };

    const renderTask = task => {
      const card = element('li', 'todo__item item task');
      card.dataset.id = task.id;
      card.dataset.completed = String(task.completed);
      const toggle = element('div', 'task__toggle');
      toggle.setAttribute('role', 'button');
      toggle.tabIndex = 0;
      toggle.addEventListener('keydown', event => {
        if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggle.click(); }
      });
      toggle.setAttribute('aria-pressed', String(task.completed));
      toggle.setAttribute('aria-label', `Выполнить задачу: ${task.value}`);
      const check = element('span', 'task__check');
      check.setAttribute('aria-hidden', 'true');
      toggle.append(check, element('span', 'task__text item__text', task.value));
      const expand = element('button', 'task__expand');
      expand.type = 'button';
      expand.hidden = true;
      expand.setAttribute('aria-label', 'Развернуть задачу');
      expand.setAttribute('aria-expanded', 'false');
      expand.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
      card.append(expand);
      const options = element('button', 'button folder__options');
      options.type = 'button';
      options.innerHTML = iconVerticalDots;
      options.setAttribute('aria-label', `Действия задачи «${task.value}»`);
      options.setAttribute('aria-haspopup', 'menu');
      options.setAttribute('aria-expanded', 'false');
      options.setAttribute('aria-controls', `task-menu-${task.id}`);
      const menu = element('div', 'folder__menu');
      menu.id = `task-menu-${task.id}`;
      menu.setAttribute('role', 'menu');
      menu.hidden = true;
      [['edit', 'Изменить'], ['delete', 'Удалить']].forEach(([action, title]) => {
        const button = element('button', `folder__menu-action${action === 'delete' ? ' is-danger' : ''}`, title);
        button.type = 'button';
        button.setAttribute('role', 'menuitem');
        button.dataset.taskAction = action;
        menu.append(button);
      });
      card.append(toggle, options, menu);
      updateTaskAppearance(card, task);
      return card;
    };

    const renderBreadcrumbs = () => {
      breadcrumbs.replaceChildren();
      const path = [];
      const seen = new Set();
      let id = currentContainerId;
      while (id && !seen.has(id)) {
        seen.add(id);
        const folder = getEntry(state, id);
        if (!folder) break;
        path.unshift(folder);
        id = folder.parentId;
      }
      [{ id: null, name: 'Главная' }, ...path].forEach((folder, index) => {
        if (index) breadcrumbs.append(element('span', 'todo__path-separator', '›'));
        const button = element('button', 'todo__path-button');
        button.type = 'button';
        button.dataset.navigateFolder = folder.id ?? '';
        button.setAttribute('aria-label', folder.name);
        button.title = folder.name;
        if (folder.type !== 'note') button.dataset.dropFolder = folder.id ?? '';
        if (folder.id === currentContainerId) {
          button.setAttribute('aria-current', 'page');
        }
        {
          const icon = element('span', 'todo__path-icon');
          icon.innerHTML = folder.id ? pathIcon(folder) : IconHome();
          button.append(icon);
        }
        if (folder.id) button.append(element('span', 'todo__path-name', folder.name));
        breadcrumbs.append(button);
      });
    };

    const renderView = () => {
      closeMenus();
      clearList();
      if (currentContainerId && (!getEntry(state, currentContainerId) || getEntry(state, currentContainerId).type === 'task')) currentContainerId = null;
      renderBreadcrumbs();
      renderContextOptions();
      const current = getEntry(state, currentContainerId);
      const back = root.querySelector('.todo__back');
      back.hidden = !current;
      back.dataset.navigateFolder = current?.parentId ?? '';
      back.disabled = controls?.isSelecting() ?? false;
      const isNote = current?.type === 'note';
      noteView.classList.toggle('--hide', !isNote);
      noteEditor.hidden = !isNote || !noteEditing;
      noteReader.hidden = !isNote || noteEditing;
      if (isNote) {
        noteReader.querySelector('.note-reader__title').textContent = current.name;
        noteReader.querySelector('.note-reader__description').textContent = current.description;
        noteEditor.elements.noteName.value = current.name;
        noteEditor.elements.description.value = current.description;
      }
      const entries = getChildren(state, currentContainerId);
      const isChecklist = current?.type === 'checklist';
      list.dataset.layout = isChecklist ? '1' : layout;
      const addTaskCard = position => {
        const card = element('li', 'todo__add-card item');
        const add = element('button', 'todo__add-task');
        add.type = 'button';
        add.dataset.insertPosition = position;
        add.innerHTML = iconPlus;
        add.append(element('span', '', 'Добавить задачу'));
        add.addEventListener('click', () => showTaskDialog(null, position));
        card.append(add);
        list.append(card);
        resizeObserver.observe(card);
      };
      if (isChecklist) addTaskCard('before');
      entries.forEach(entry => {
        const card = entry.type === 'task' ? renderTask(entry) : renderContainer(entry);
        list.append(card);
        resizeObserver.observe(card);
      });
      if (isChecklist) addTaskCard('after');
      list.dataset.dropFolder = currentContainerId ?? '';
      emptyMessage.dataset.dropFolder = currentContainerId ?? '';
      list.classList.toggle('--hide', isNote || !entries.length && !isChecklist);
      emptyMessage.classList.toggle('--hide', isNote || isChecklist || Boolean(entries.length));
      emptyMessage.textContent = currentContainerId ? (getEntry(state, currentContainerId).type === 'checklist' ? 'Перечень пуст' : 'Папка пуста') : 'Список пуст';
      updateContainerCards();
      controls?.refresh();
      noteTextareas.resize();
      queueCardLayout();
    };

    const navigate = id => {
      if (controls?.isSelecting()) { showNotice('Завершите выбор, чтобы перейти в другой раздел.'); return; }
      currentContainerId = id;
      noteEditing = false;
      try {
        if (id) localStorage.setItem('todo-current-folder', id);
        else localStorage.removeItem('todo-current-folder');
      } catch { /* Навигация работает без сохранения пути. */ }
      renderView();
    };

    const startNoteEditing = note => {
      closeMenus();
      if (note?.type !== 'note') return;
      if (note.id !== currentContainerId) navigate(note.id);
      noteEditing = true;
      renderView();
      noteEditor.elements.noteName.focus();
    };
    noteReader.querySelector('.btn-note-edit').addEventListener('click', () => startNoteEditing(getEntry(state, currentContainerId)));
    noteEditor.querySelector('.btn-note-cancel').addEventListener('click', () => {
      noteEditing = false;
      renderView();
      noteReader.querySelector('.btn-note-edit').focus();
      showNotice('Изменения отменены.');
    });

    const showContainerDialog = (folder = null, type = 'folder') => {
      const parent = getEntry(state, currentContainerId);
      if (!folder && parent && parent.type !== 'folder') return;
      containerBeingRenamed = folder?.id ?? null;
      containerBeingCreated = folder?.type ?? type;
      const entry = { type: containerBeingCreated };
      folderModal.querySelector('.text').textContent = `${folder ? 'Переименовать' : 'Создать'} ${containerNoun(entry)}`;
      folderModal.querySelector('.folder-name-label').textContent = `Название ${containerGenitive(entry)}`;
      folderModal.querySelector('.btn-folder-save').textContent = folder ? 'Сохранить' : 'Создать';
      folderName.value = folder?.name ?? '';
      folderName.placeholder = formatFolderName();
      folderModal.querySelector('.folder-name-hint').textContent = `Без названия — текущая дата и время, например ${formatFolderName()}.`;
      openDialog(folderModal);
      folderName.focus();
      folderName.select();
    };

    const showTaskDialog = (task = null, position = 'after') => {
      if (getEntry(state, currentContainerId)?.type !== 'checklist') return;
      taskBeingEdited = task?.id ?? null;
      taskInsertPosition = position;
      taskForm.reset();
      taskForm.elements.task.value = task?.value ?? '';
      taskModal.querySelector('#todo-task-title').textContent = task ? 'Изменить задачу' : 'Добавить задачу';
      taskModal.querySelector('.btn-task-save').textContent = task ? 'Сохранить' : 'Добавить';
      openDialog(taskModal);
      noteTextareas.resize();
      taskForm.elements.task.focus();
    };

    const showNoteDialog = () => {
      const parent = getEntry(state, currentContainerId);
      if (parent && parent.type !== 'folder') return;
      noteForm.reset();
      noteForm.elements.noteName.placeholder = formatFolderName();
      noteModal.querySelector('.folder-name-hint').textContent = `Без названия — текущая дата и время, например ${formatFolderName()}.`;
      openDialog(noteModal);
      noteTextareas.resize();
      noteForm.elements.noteName.focus();
    };

    const showDeleteDialog = folder => {
      pendingDelete = { action: 'delete', folderId: folder.id };
      deleteModal.querySelector('.text').textContent = `Удалить ${containerNoun(folder)} «${folder.name}»?`;
      deleteModal.querySelector('.modal-description').textContent = folder.type === 'note' ? 'Заметка и её описание будут удалены.' : folder.type === 'checklist'
        ? 'Перечень и все его задачи будут удалены.' : 'Папка и все вложенные элементы, включая перечни и их задачи, будут удалены.';
      deleteModal.querySelector('.btn-modal-ok').textContent = 'Удалить';
      openDialog(deleteModal);
    };

    const applyDrop = (ids, destination) => {
        const entry = getEntry(state, ids[0]);
        const { parentId, referenceId, position } = destination;
        const changed = destination.type === 'swap' ? swapEntries(state, ids[0], referenceId)
          : placeEntries(state, ids, parentId, referenceId ?? null, position ?? 'after');
        if (!changed) { showNotice('Элемент уже на этом месте.'); return; }
        persist(destination.type === 'swap' ? 'Элементы поменялись местами. Порядок сохранён.' : destination.type === 'order' ? 'Порядок элементов сохранён.'
          : `${ids.length > 1 ? `Перемещено элементов: ${ids.length}` : entry.type === 'note' ? 'Заметка перемещена' : entry.type === 'folder' ? 'Папка перемещена' : entry.type === 'checklist' ? 'Перечень перемещён' : 'Задача перемещена'} в ${parentId ? `«${getEntry(state, parentId).name}»` : '«Главная»'}.`);
        controls?.finishSelection();
        renderView();
    };
    initDragAndDrop({ root, getEntry: id => getEntry(state, id),
      getDragIds: id => { closeMenus(); return controls?.getDragIds(id) ?? [id]; },
      canDrop: (ids, destination) => destination.type === 'swap' ? ids.length === 1 && canSwapEntries(state, ids[0], destination.referenceId)
        : destination.type === 'folder' && destination.referenceId
          ? getEntry(state, destination.parentId)?.type === 'folder' && canPlaceEntries(state, ids, destination.parentId)
            || ids.length === 1 && canSwapEntries(state, ids[0], destination.referenceId)
          : canPlaceEntries(state, ids, destination.parentId),
      onDrop: (ids, destination) => {
        if (destination.type === 'folder' && destination.referenceId) controls.chooseDrop(ids, destination);
        else applyDrop(ids, destination);
      }, onHoverFolder: navigate, onStatus: showNotice });
    controls = initWorkspaceControls({ root, state, getCurrentId: () => currentContainerId, navigate, renderView,
      openDialog, closeDialog, showNotice, applyDrop, iconFor: containerIcon,
      requestDelete: ids => {
        pendingDelete = { action: 'batch', ids };
        deleteModal.querySelector('.text').textContent = `Удалить выбранные элементы (${ids.length})?`;
        deleteModal.querySelector('.modal-description').textContent = 'Выбранные элементы и всё содержимое выбранных папок и перечней будут удалены.';
        deleteModal.querySelector('.btn-modal-ok').textContent = 'Удалить';
        openDialog(deleteModal);
      },
    });

    noteForm.addEventListener('submit', event => {
      event.preventDefault();
      const parent = getEntry(state, currentContainerId);
      if (noteModal.classList.contains('close') || (parent && parent.type !== 'folder')) return;
      state.notes.push({ id: crypto.randomUUID(), type: 'note',
        name: noteForm.elements.noteName.value.trim() || formatFolderName(),
        description: noteForm.elements.description.value, parentId: currentContainerId, order: nextOrder(state) });
      persist('Заметка создана.');
      renderView();
      closeDialog(noteModal);
    });
    noteEditor.addEventListener('submit', event => {
      event.preventDefault();
      const note = getEntry(state, currentContainerId);
      if (note?.type !== 'note' || !noteEditing) return;
      note.name = noteEditor.elements.noteName.value.trim() || formatFolderName();
      note.description = noteEditor.elements.description.value;
      persist('Заметка сохранена.');
      noteEditing = false;
      renderView();
    });

    taskForm.addEventListener('submit', event => {
      event.preventDefault();
      if (taskModal.classList.contains('close') || getEntry(state, currentContainerId)?.type !== 'checklist') return;
      const value = taskForm.elements.task.value.trim();
      if (!value) { notices.error('Введите название задачи.'); return; }
      if (taskBeingEdited) {
        const task = getEntry(state, taskBeingEdited);
        if (!task || task.type !== 'task') return;
        task.value = value;
      } else {
        const first = getChildren(state, currentContainerId)[0];
        const task = { id: crypto.randomUUID(), type: 'task', value, status: 'pending', completed: false, parentId: currentContainerId, order: nextOrder(state) };
        state.tasks.push(task);
        if (taskInsertPosition === 'before' && first) placeEntries(state, [task.id], currentContainerId, first.id, 'before');
      }
      persist(taskBeingEdited ? 'Задача изменена.' : 'Задача добавлена.');
      renderView();
      closeDialog(taskModal);
    });
    folderForm.addEventListener('submit', event => {
      event.preventDefault();
      if (folderModal.classList.contains('close')) return;
      const name = folderName.value.trim() || formatFolderName();
      if (containerBeingRenamed) getEntry(state, containerBeingRenamed).name = name;
      else {
        const parent = getEntry(state, currentContainerId);
        if (parent && parent.type !== 'folder') return;
        state[containerBeingCreated === 'checklist' ? 'checklists' : 'folders'].push({
          id: crypto.randomUUID(), type: containerBeingCreated, name, parentId: currentContainerId, order: nextOrder(state),
        });
      }
      const entityName = containerBeingCreated === 'checklist' ? 'Перечень' : 'Папка';
      persist(`${entityName} ${containerBeingRenamed ? containerBeingCreated === 'checklist' ? 'переименован' : 'переименована' : containerBeingCreated === 'checklist' ? 'создан' : 'создана'}.`);
      renderView();
      closeDialog(folderModal);
    });

    root.addEventListener('click', event => {
      const path = event.target.closest('[data-navigate-folder]');
      if (path) { navigate(path.dataset.navigateFolder || null); return; }
      const options = event.target.closest('.folder__options, .todo__menu-trigger');
      if (options) {
        const menu = document.getElementById(options.getAttribute('aria-controls'));
        const wasOpen = menu === openMenu;
        closeMenus();
        if (!wasOpen) {
          openMenu = menu;
          menuTrigger = options;
          showMenu(menu);
          options.setAttribute('aria-expanded', 'true');
          options.closest('.todo__item, .todo__menu-container').classList.add('has-open-menu');
          menu.querySelector('button').focus();
        }
        return;
      }
      const toolbarAction = event.target.closest('[data-toolbar-action]');
      if (toolbarAction) {
        closeMenus(true);
        const action = toolbarAction.dataset.toolbarAction;
        if (action === 'add') { if (!controls.isSelecting()) openDialog(addModal); return; }
        if (toolbarAction.closest('#todo-add-modal')) {
          if (addModal.classList.contains('close')) return;
          addModal.close();
        }
        if (action === 'folder') showContainerDialog();
        if (action === 'task') showTaskDialog();
        if (action === 'text') showNoteDialog();
        if (action === 'checklist') showContainerDialog(null, 'checklist');
        if (['search', 'view', 'select'].includes(action)) controls.action(action);
        return;
      }
      const folderAction = event.target.closest('[data-folder-action]');
      if (folderAction) {
        const folder = getEntry(state, folderAction.dataset.folderId ?? folderAction.closest('.folder').dataset.id);
        if (folderAction.dataset.folderAction === 'open') navigate(folder.id);
        if (folderAction.dataset.folderAction === 'rename') showContainerDialog(folder);
        if (folderAction.dataset.folderAction === 'edit-note') startNoteEditing(folder);
        if (folderAction.dataset.folderAction === 'delete') showDeleteDialog(folder);
        return;
      }
      const card = event.target.closest('.todo__item');
      if (!card) return;
      const task = getEntry(state, card.dataset.id);
      if (task && task.type !== 'task' && !event.target.closest('.folder__menu') && !card.classList.contains('is-disappearing')) {
        closeMenus(); navigate(task.id); return;
      }
      if (!task || task.type !== 'task') return;
      if (event.target.closest('.task__expand')) {
        const startHeight = card.getBoundingClientRect().height;
        taskExpandAnimations.get(card)?.cancel();
        card.classList.remove('is-animating');
        const expanded = card.classList.toggle('is-expanded');
        const button = card.querySelector('.task__expand');
        button.setAttribute('aria-expanded', String(expanded));
        button.setAttribute('aria-label', expanded ? 'Свернуть задачу' : 'Развернуть задачу');
        // Не позволяем фокусу следовать за кнопкой в самый низ длинной карточки.
        card.querySelector('.task__toggle').focus({ preventScroll: true });
        const endHeight = card.getBoundingClientRect().height;
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const duration = getComputedStyle(card).getPropertyValue('--task-expand-duration').trim();
          const durationMs = parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
          const distance = Math.abs(endHeight - startHeight);
          const viewportStep = Math.max(240, innerHeight * 0.75);
          const isLong = distance > viewportStep;
          const animationDuration = isLong && durationMs > 0
            ? Math.min(durationMs * 5, durationMs * (2 + Math.log2(distance / viewportStep + 1) * 0.3)) : durationMs || 0;
          const frames = isLong ? [
            { height: `${startHeight}px`, offset: 0 },
            { height: `${expanded ? startHeight + viewportStep : endHeight + viewportStep}px`, offset: expanded ? 0.65 : 0.35 },
            { height: `${endHeight}px`, offset: 1 },
          ] : [{ height: `${startHeight}px` }, { height: `${endHeight}px` }];
          card.classList.add('is-animating');
          const animation = card.animate(frames, {
            duration: animationDuration, easing: isLong ? 'linear' : 'cubic-bezier(0.22, 1, 0.36, 1)',
          });
          taskExpandAnimations.set(card, animation);
          animation.finished.then(() => {
            if (taskExpandAnimations.get(card) !== animation) return;
            taskExpandAnimations.delete(card);
            card.classList.remove('is-animating');
            queueCardLayout();
          }).catch(() => {});
        }
        queueCardLayout();
        return;
      }
      const taskAction = event.target.closest('[data-task-action]');
      if (taskAction?.dataset.taskAction === 'edit') { showTaskDialog(task); return; }
      if (taskAction?.dataset.taskAction === 'delete') {
        closeMenus();
        card.classList.add('is-disappearing');
        state.tasks = state.tasks.filter(item => item.id !== task.id);
        persist('Задача удалена.');
        updateContainerCards();
        setTimeout(renderView, 300);
        return;
      }
      if (card.classList.contains('is-disappearing') || event.target.closest('.folder__menu')) return;
      closeMenus();
      const status = advanceTaskStatus(task);
      updateTaskAppearance(card, task);
      persist({ pending: 'Статус задачи сброшен.', 'in-progress': 'Задача в процессе.', completed: 'Задача выполнена.' }[status]);
      updateContainerCards();
    });
    root.querySelector('.todo__layout').addEventListener('change', event => {
      if (!event.target.matches('input[name="todo-layout"]')) return;
      layout = event.target.value;
      list.dataset.layout = getEntry(state, currentContainerId)?.type === 'checklist' ? '1' : layout;
      queueCardLayout();
      try { localStorage.setItem(layoutStorageKey, layout); notices.success('Вид списка сохранён.'); }
      catch { notices.error('Не удалось сохранить вид списка в браузере.'); }
    });
    deleteModal.querySelector('.btn-modal-ok').addEventListener('click', () => {
      if (!pendingDelete || deleteModal.classList.contains('close')) return;
      const { action, folderId } = pendingDelete;
      const deleted = getEntry(state, folderId);
      const message = action === 'batch' ? `Удалено элементов: ${pendingDelete.ids.length}.`
        : deleted?.type === 'note' ? 'Заметка удалена.' : deleted?.type === 'checklist' ? 'Перечень удалён.' : 'Папка удалена.';
      if (action === 'batch') { deleteEntries(state, pendingDelete.ids); controls.finishSelection(); }
      else {
        const folder = getEntry(state, folderId);
        if (!folder) return;
        if (descendantContainerIds(state, folderId).has(currentContainerId)) currentContainerId = folder.parentId;
        deleteContainer(state, folderId);
      }
      pendingDelete = null;
      persist(message);
      navigate(currentContainerId && getEntry(state, currentContainerId) ? currentContainerId : null);
      closeDialog(deleteModal);
    });
    [deleteModal, folderModal, taskModal, noteModal, addModal].forEach(dialog => {
      dialog.querySelector('.btn-modal-close').addEventListener('click', () => closeDialog(dialog));
      dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
      dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(dialog); });
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.folder__menu, .folder__options, .todo__menu-trigger')) closeMenus();
    });
    document.addEventListener('keydown', event => {
      if (!openMenu) return;
      if (event.key === 'Escape') { event.preventDefault(); closeMenus(true); return; }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const buttons = [...openMenu.querySelectorAll('button:not(:disabled)')];
        const index = buttons.indexOf(document.activeElement);
        buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length].focus();
      }
      if (event.key === 'Tab') closeMenus();
    });
    renderView();
  });

  return `
  <div class="todo" id="todo">
    <header class="todo__header">
      <h1 class="todo__title">Мои заметки</h1>
      <div class="todo__menu-container todo__context-options"></div>
    </header>
    <div class="todo__navigation">
      <nav class="todo__breadcrumbs" aria-label="Путь к разделу"></nav>
      <div class="todo__toolbar">
        <button class="button todo__back" type="button" aria-label="Назад" title="Назад" data-navigate-folder="" hidden><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h14"/></svg></button>
      </div>
    </div>
    <dialog id="todo-add-modal" class="todo-modal add-modal" aria-labelledby="todo-add-title">
      <div class="panel">
        <div class="workspace-modal__header">
          <h2 class="text" id="todo-add-title">Добавить элемент</h2>
          <button class="button btn-modal-close" type="button" aria-label="Закрыть"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
        </div>
        <div class="todo__add-options">
          <button class="todo__add-option" type="button" data-toolbar-action="folder">${IconMenu('folder')}<span>Добавить папку</span></button>
          <button class="todo__add-option" type="button" data-toolbar-action="text">${IconMenu('text')}<span>Добавить заметку</span></button>
          <button class="todo__add-option" type="button" data-toolbar-action="checklist">${IconMenu('checklist')}<span>Добавить перечень</span></button>
        </div>
      </div>
    </dialog>
    <section class="todo__note-view note-view --hide" aria-label="Заметка">
      <article class="note-reader">
        <div class="note-reader__header">
          <h2 class="note-reader__title"></h2>
          ${Button('Изменить', 'btn-note-edit')}
        </div>
        <p class="note-reader__description"></p>
      </article>
      <form id="todo-note-editor" class="note-editor" hidden>
        <label class="modal-label" for="note-editor-name">Название заметки</label>
        <input id="note-editor-name" class="input__field" name="noteName" type="text" autocomplete="off">
        <label class="modal-label" for="note-editor-description">Описание</label>
        <textarea id="note-editor-description" class="input__field note-description" name="description" placeholder="Напишите заметку" data-autoresize></textarea>
        <div class="note-editor__actions">${Button('Отмена', 'btn-note-cancel')}${Button('Сохранить', 'btn-note-save', 'submit')}</div>
      </form>
    </section>
    <div class="todo__count">
      <div class="todo__count-value"></div>
      <div class="todo__actions">
        <div class="todo__layout" role="group" aria-label="Вид задач">
          ${['1', '2', '3'].map(columns => {
            const label = columns === '1' ? 'Список: карточки на всю ширину' : `${columns === '2' ? 'Две' : 'Три'} карточки в строке`;
            return `<label class="todo__layout-option" title="${label}">
              <input type="radio" name="todo-layout" value="${columns}" aria-label="${label}"${layout === columns ? ' checked' : ''}>
              <span class="todo__layout-icon" style="--icon-columns: ${columns}" aria-hidden="true">${'<span></span>'.repeat(Number(columns) * 2)}</span>
            </label>`;
          }).join('')}
        </div>
      </div>
    </div>
    <ul class="todo__list" data-layout="${layout}"></ul>
    <div class="todo__list-empty">Список пуст</div>
    <dialog id="todo-modal" class="todo-modal" aria-labelledby="todo-delete-title" aria-describedby="todo-delete-description">
      <div class="panel">
        <p class="text" id="todo-delete-title"></p>
        <p class="modal-description" id="todo-delete-description"></p>
        <div class="actions">${Button('Удалить', 'btn-modal-ok')}${Button('Отмена', 'btn-modal-close')}</div>
      </div>
    </dialog>
    <dialog id="todo-folder-modal" class="todo-modal" aria-labelledby="todo-folder-title">
      <form class="panel">
        <p class="text" id="todo-folder-title">Создать папку</p>
        <label class="folder-name-label" for="folder-name">Название папки</label>
        <input id="folder-name" class="input__field" name="folderName" type="text" autocomplete="off" aria-describedby="folder-name-hint">
        <p class="folder-name-hint" id="folder-name-hint"></p>
        <div class="actions">${Button('Создать', 'btn-folder-save', 'submit')}${Button('Отмена', 'btn-modal-close')}</div>
      </form>
    </dialog>
    <dialog id="todo-note-modal" class="todo-modal note-modal" aria-labelledby="todo-note-title">
      <form class="panel note-editor" data-textarea-boundary>
        <p class="text" id="todo-note-title">Создать заметку</p>
        <label class="modal-label" for="note-name">Название заметки</label>
        <input id="note-name" class="input__field" name="noteName" type="text" autocomplete="off">
        <p class="folder-name-hint"></p>
        <label class="modal-label" for="note-description">Описание</label>
        <textarea id="note-description" class="input__field note-description" name="description" placeholder="Напишите заметку" data-autoresize></textarea>
        <div class="actions task-actions">${Button('Создать', 'btn-note-create', 'submit')}${Button('Отмена', 'btn-modal-close')}</div>
      </form>
    </dialog>
    <dialog id="todo-task-modal" class="todo-modal textarea-modal" aria-labelledby="todo-task-title">
      <form class="panel note-editor" id="todo-task-form" data-textarea-boundary>
        <p class="text" id="todo-task-title">Добавить задачу</p>
        <label class="modal-label" for="task-name">Текст задачи</label>
        <textarea id="task-name" class="input__field note-description" name="task" placeholder="Добавить задачу" data-autoresize required></textarea>
        <div class="actions task-actions">${Button('Добавить', 'btn-task-save', 'submit')}${Button('Отмена', 'btn-modal-close')}</div>
      </form>
    </dialog>
  </div>`;
}
