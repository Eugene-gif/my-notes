import './WorkspaceControls.css';
import { showMenu, hideMenu } from './MenuAnimation';
import { allEntries, getEntry, getChildren, canPlaceEntries, canSwapEntries } from './TodoStore';
import { setMenuAction } from '@/assets/icons/IconMenu';

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (text, className = 'button') => {
  const node = make('button', className, text);
  node.type = 'button';
  return node;
};

export function initWorkspaceControls({ root, state, getCurrentId, navigate, renderView, openDialog, closeDialog, showNotice, requestDelete, applyDrop, iconFor }) {
  let selecting = false;
  const selected = new Set();
  let pendingDrop = null;
  const positionDropMenu = () => {
    if (!pendingDrop) return;
    const { menu, point } = pendingDrop;
    const box = menu.getBoundingClientRect();
    const gap = 12;
    menu.style.left = `${Math.max(gap, Math.min(point.x, innerWidth - box.width - gap))}px`;
    menu.style.top = `${Math.max(gap, Math.min(point.y, innerHeight - box.height - gap))}px`;
  };
  window.addEventListener('resize', positionDropMenu);
  const list = root.querySelector('.todo__list');
  const actions = root.querySelector('.todo__actions');
  const breadcrumbs = root.querySelector('.todo__breadcrumbs');
  const batch = make('div', 'todo__batch-actions');
  const selectionCount = make('span', 'todo__selection-count');
  selectionCount.setAttribute('role', 'status');
  const selectAll = button('Выбрать все');
  const remove = button('Удалить выбранные', 'button is-danger');
  batch.append(selectionCount, selectAll, remove);
  actions.prepend(batch);
  const cancel = button('Отмена', 'button todo__cancel');
  actions.after(cancel);

  const createDialog = (id, title, className = '') => {
    const dialog = make('dialog', `todo-modal ${className}`);
    dialog.id = id;
    dialog.setAttribute('aria-labelledby', `${id}-title`);
    const panel = make('div', 'panel');
    const header = make('div', 'workspace-modal__header');
    const heading = make('h2', 'text', title);
    heading.id = `${id}-title`;
    const close = button('', 'button btn-modal-close');
    close.innerHTML = '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    close.setAttribute('aria-label', 'Закрыть');
    close.title = 'Закрыть';
    header.append(heading, close);
    panel.append(header);
    dialog.append(panel);
    root.append(dialog);
    close.addEventListener('click', () => closeDialog(dialog));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(dialog); });
    return { dialog, panel };
  };

  const { dialog: viewDialog, panel: viewPanel } = createDialog('todo-view-modal', 'Вид', 'view-modal');
  const layout = root.querySelector('.todo__layout');
  layout.querySelectorAll('label').forEach(label => {
    label.append(make('span', 'todo__layout-name', label.querySelector('input').value === '1' ? 'Список' : `${label.querySelector('input').value} колонки`));
  });
  viewPanel.append(layout);

  const { dialog: searchDialog, panel: searchPanel } = createDialog('todo-search-modal', 'Поиск', 'search-modal');
  const searchLabel = make('label', 'modal-label', 'Название или описание');
  searchLabel.htmlFor = 'todo-search-input';
  const searchInput = make('input', 'input__field');
  searchInput.id = 'todo-search-input';
  searchInput.type = 'search';
  searchInput.placeholder = 'Поиск по всем элементам';
  const searchStatus = make('p', 'search-status', 'Введите текст для поиска');
  searchStatus.setAttribute('role', 'status');
  const results = make('div', 'search-results');
  results.setAttribute('aria-label', 'Результаты поиска');
  searchPanel.append(searchLabel, searchInput, searchStatus, results);

  const highlight = (text, query) => {
    const fragment = document.createDocumentFragment();
    const lower = text.toLocaleLowerCase('ru');
    let start = 0, index;
    while ((index = lower.indexOf(query, start)) !== -1) {
      fragment.append(document.createTextNode(text.slice(start, index)), make('mark', '', text.slice(index, index + query.length)));
      start = index + query.length;
    }
    fragment.append(document.createTextNode(text.slice(start)));
    return fragment;
  };
  const parentPath = entry => {
    const names = [], seen = new Set();
    let parent = getEntry(state, entry.parentId);
    while (parent && !seen.has(parent.id)) { seen.add(parent.id); names.unshift(parent.name); parent = getEntry(state, parent.parentId); }
    return ['Главная', ...names].join(' › ');
  };
  const renderResults = () => {
    results.replaceChildren();
    const query = searchInput.value.trim().toLocaleLowerCase('ru');
    if (!query) { searchStatus.textContent = 'Введите текст для поиска'; return; }
    const entries = getEntry(state, getCurrentId())?.type === 'checklist' ? getChildren(state, getCurrentId()) : allEntries(state);
    const matches = entries.filter(entry => [entry.value ?? entry.name, entry.description ?? ''].some(text => text.toLocaleLowerCase('ru').includes(query)));
    searchStatus.textContent = matches.length ? `Найдено: ${matches.length}` : 'Ничего не найдено';
    matches.forEach(entry => {
      const result = button('', 'search-result');
      const icon = make('span', 'todo__path-icon');
      icon.innerHTML = entry.type === 'task' ? '<span aria-hidden="true">✔</span>' : iconFor(entry);
      const text = make('span', 'search-result__text');
      const title = make('span', 'search-result__title');
      title.append(highlight(entry.value ?? entry.name, query));
      text.append(title, make('span', 'search-result__path', parentPath(entry)));
      if (entry.description) {
        const matchAt = entry.description.toLocaleLowerCase('ru').indexOf(query);
        const start = Math.max(0, matchAt - 60);
        const snippet = entry.description.slice(start, start + Math.max(220, query.length + 120));
        const description = make('span', 'search-result__description');
        description.append(document.createTextNode(start ? '…' : ''), highlight(snippet, query));
        text.append(description);
      }
      result.append(icon, text);
      result.addEventListener('click', () => {
        if (selecting || searchDialog.classList.contains('close')) return;
        closeDialog(searchDialog);
        navigate(entry.type === 'task' ? entry.parentId : entry.id);
        if (entry.type === 'task') {
          const card = [...list.children].find(item => item.dataset.id === entry.id);
          card?.classList.add('is-search-result');
          setTimeout(() => { card?.scrollIntoView({ block: 'center', behavior: 'smooth' }); card?.querySelector('.task__toggle').focus({ preventScroll: true }); }, 550);
          setTimeout(() => card?.classList.remove('is-search-result'), 4000);
        }
      });
      results.append(result);
    });
  };
  let searchTimer = null;
  const cancelSearch = () => { clearTimeout(searchTimer); searchTimer = null; };
  searchInput.addEventListener('input', () => {
    cancelSearch();
    searchTimer = setTimeout(() => {
      searchTimer = null;
      if (searchDialog.open && !searchDialog.classList.contains('close')) renderResults();
    }, 300);
  });
  searchDialog.addEventListener('close', cancelSearch);

  const { dialog: pathDialog, panel: pathPanel } = createDialog('todo-path-modal', 'Путь к разделу', 'path-modal');
  const pathItems = make('div', 'path-items');
  pathPanel.append(pathItems);
  const ellipsis = button('…', 'todo__path-button todo__path-ellipsis');
  ellipsis.setAttribute('aria-label', 'Показать полный путь');
  ellipsis.addEventListener('click', () => {
    if (selecting) return;
    pathItems.replaceChildren();
    breadcrumbs.querySelectorAll('[data-navigate-folder]').forEach(item => {
      const copy = item.cloneNode(true);
      copy.hidden = false;
      copy.removeAttribute('data-drop-folder');
      copy.removeAttribute('data-navigate-folder');
      if (!item.dataset.navigateFolder) {
        copy.append(make('span', 'todo__path-name', 'На главную'));
        copy.setAttribute('aria-label', 'На главную');
      }
      copy.addEventListener('click', () => { closeDialog(pathDialog); navigate(item.dataset.navigateFolder || null); });
      pathItems.append(copy);
    });
    openDialog(pathDialog);
  });
  const compactPath = () => {
    ellipsis.remove();
    [...breadcrumbs.children].forEach(item => { item.hidden = false; });
    const links = [...breadcrumbs.querySelectorAll('[data-navigate-folder]')];
    if (links.length < 3) return;
    // Измеряем полный путь; только при нехватке места сворачиваем предков.
    const fullWidth = [...breadcrumbs.children].reduce((width, item) => {
      const name = item.querySelector('.todo__path-name');
      return width + item.getBoundingClientRect().width + (name ? Math.max(0, name.scrollWidth - name.clientWidth) : 0) + 4;
    }, -4);
    if (fullWidth <= breadcrumbs.clientWidth) return;
    [...breadcrumbs.children].forEach(item => { item.hidden = true; });
    links[0].hidden = false;
    links.at(-1).hidden = false;
    const separators = [...breadcrumbs.querySelectorAll('.todo__path-separator')];
    separators[0].hidden = false;
    separators.at(-1).hidden = false;
    separators[0].after(ellipsis);
  };
  new ResizeObserver(compactPath).observe(breadcrumbs);

  const updateSelection = () => {
    root.querySelector('.todo__back').disabled = selecting;
    root.classList.toggle('is-selecting', selecting);
    batch.hidden = !selecting;
    selectionCount.textContent = `Выбрано: ${selected.size}`;
    remove.disabled = selected.size === 0;
    const cards = [...list.children].filter(card => card.dataset.id);
    selectAll.textContent = selected.size === cards.length && selected.size ? 'Снять выбор' : 'Выбрать все';
    cancel.hidden = !selecting && !pendingDrop;
    list.querySelectorAll('.todo__add-task').forEach(addTask => { addTask.disabled = selecting; });
    root.querySelectorAll('.todo__context-options [data-folder-action], .todo__context-options [data-toolbar-action="search"]').forEach(item => { item.disabled = selecting; });
    root.querySelectorAll('.todo__context-options [data-toolbar-action="add"]').forEach(item => { item.disabled = selecting; });
    cards.forEach(card => {
      const active = selected.has(card.dataset.id);
      card.classList.toggle('is-selected', active);
      let check = card.querySelector('.item__selection');
      if (selecting && !check) {
        check = button('', 'item__selection');
        check.setAttribute('aria-label', `Выбрать ${getEntry(state, card.dataset.id).value ?? getEntry(state, card.dataset.id).name}`);
        card.prepend(check);
      }
      if (check) { check.hidden = !selecting; check.textContent = active ? '✔' : ''; check.setAttribute('aria-pressed', String(active)); }
    });
  };
  const cancelDrop = () => {
    if (!pendingDrop) return;
    hideMenu(pendingDrop.menu, { remove: true });
    pendingDrop.destination.element?.classList.remove('has-open-menu', 'is-drop-target');
    pendingDrop = null;
    updateSelection();
    showNotice('Перенос отменён.');
  };
  const finishSelection = () => { selecting = false; selected.clear(); updateSelection(); };
  cancel.addEventListener('click', () => { if (pendingDrop) cancelDrop(); else { finishSelection(); renderView(); } });
  selectAll.addEventListener('click', () => {
    const cards = [...list.children].filter(card => card.dataset.id);
    if (selected.size === cards.length) selected.clear();
    else cards.forEach(card => selected.add(card.dataset.id));
    updateSelection();
  });
  remove.addEventListener('click', () => { if (selected.size) requestDelete([...selected]); });

  // В режиме выделения клик не открывает карточки и не меняет выполнение задач.
  root.addEventListener('click', event => {
    if (!selecting || event.target.closest('dialog, .todo__drop-choice')) return;
    const card = event.target.closest('.todo__item');
    if (card) {
      event.preventDefault(); event.stopImmediatePropagation();
      const id = card.dataset.id;
      if (selected.has(id)) selected.delete(id); else selected.add(id);
      updateSelection();
    } else if (event.target.closest('[data-navigate-folder], .todo__path-ellipsis')) {
      event.preventDefault(); event.stopImmediatePropagation();
      showNotice('Завершите выбор, чтобы перейти в другой раздел.');
    }
  }, true);
  document.addEventListener('pointerdown', event => {
    if (pendingDrop && !event.target.closest('.todo__drop-choice, .todo__cancel')) cancelDrop();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !root.querySelector('dialog[open]')) {
      if (pendingDrop) { event.preventDefault(); cancelDrop(); }
      else if (selecting) { event.preventDefault(); finishSelection(); renderView(); }
    }
  });

  return {
    isSelecting: () => selecting,
    getDragIds: id => {
      cancelDrop();
      if (!selecting) return [id];
      if (!selected.has(id)) return [id];
      return getChildren(state, getCurrentId()).filter(item => selected.has(item.id)).map(item => item.id);
    },
    finishSelection,
    markEntry: id => {
      if (!getChildren(state, getCurrentId()).some(entry => entry.id === id)) return;
      cancelDrop(); selecting = true; selected.add(id); renderView();
      showNotice('Элемент выбран. Можно выбрать другие карточки для переноса или удаления.');
    },
    action: action => {
      if (action === 'select') {
        if (!getChildren(state, getCurrentId()).length) return;
        cancelDrop(); selecting = !selecting; selected.clear(); updateSelection(); renderView();
        showNotice(selecting ? 'Нажимайте на карточки, чтобы выбрать их. Перетаскивайте выбранные за карточку задачи или иконку элемента.' : 'Выбор завершён.');
      }
      if (action === 'view' && getEntry(state, getCurrentId())?.type !== 'checklist') openDialog(viewDialog);
      if (action === 'search') {
        if (selecting) { showNotice('Завершите выбор, чтобы открыть поиск.'); return; }
        const isChecklist = getEntry(state, getCurrentId())?.type === 'checklist';
        searchInput.placeholder = isChecklist ? 'Поиск по задачам перечня' : 'Поиск по всем элементам';
        searchLabel.textContent = isChecklist ? 'Текст задачи' : 'Название или описание';
        cancelSearch(); searchInput.value = ''; renderResults(); openDialog(searchDialog); searchInput.focus();
      }
    },
    refresh: () => {
      const menu = root.querySelector('.todo__context-options .folder__menu');
      const isNote = getEntry(state, getCurrentId())?.type === 'note';
      const isChecklist = getEntry(state, getCurrentId())?.type === 'checklist';
      const isHome = !getCurrentId();
      const isFolder = getEntry(state, getCurrentId())?.type === 'folder';
      const hasChildren = getChildren(state, getCurrentId()).length > 0;
      if (!hasChildren) {
        selecting = false;
        selected.clear();
        menu.querySelector('[data-toolbar-action="select"]')?.remove();
      }
      for (const [action, label] of [['add', 'Добавить'], ['search', 'Поиск'], ['view', 'Вид'], ['select', selecting ? 'Завершить выбор' : 'Выбрать']]) {
        if (action === 'add' && !isHome && !isFolder) continue;
        if (isNote && action !== 'search') continue;
        if (isChecklist && action === 'view') continue;
        if (action === 'select' && !hasChildren) continue;
        let item = menu.querySelector(`[data-toolbar-action="${action}"]`);
        if (!item) { item = button(label, 'folder__menu-action'); item.dataset.toolbarAction = action; item.setAttribute('role', 'menuitem'); menu.append(item); }
        item.textContent = label;
      }
      for (const id of selected) if (![...list.children].some(card => card.dataset.id === id)) selected.delete(id);
      menu.querySelectorAll('.is-danger').forEach(item => menu.append(item));
      const selectItem = menu.querySelector('[data-toolbar-action="select"]');
      if (isChecklist && selectItem) menu.prepend(selectItem);
      if (isHome) {
        for (const action of ['add', 'select', 'search', 'view']) {
          const item = menu.querySelector(`[data-toolbar-action="${action}"]`);
          if (item) menu.append(item);
        }
      }
      if (isFolder) {
        for (const selector of ['[data-toolbar-action="add"]', '[data-toolbar-action="select"]', '[data-folder-action="rename"]', '[data-toolbar-action="search"]', '[data-toolbar-action="view"]', '[data-folder-action="delete"]']) {
          const item = menu.querySelector(selector);
          if (item) menu.append(item);
        }
      }
      root.querySelectorAll('.folder__menu-action').forEach(item => {
        setMenuAction(item, item.dataset.toolbarAction || item.dataset.folderAction || item.dataset.taskAction);
      });
      updateSelection();
      requestAnimationFrame(compactPath);
    },
    chooseDrop: (ids, destination) => {
      cancelDrop();
      const target = getEntry(state, destination.parentId);
      const menu = make('div', 'folder__menu todo__drop-choice');
      menu.setAttribute('role', 'menu');
      menu.setAttribute('aria-label', 'Действие при переносе');
      const move = button(target.type === 'folder' ? 'Переместить в папку' : 'Переместить в перечень', 'folder__menu-action');
      const swap = button('Поменять местами', 'folder__menu-action');
      setMenuAction(move, 'move'); setMenuAction(swap, 'swap');
      move.setAttribute('role', 'menuitem'); swap.setAttribute('role', 'menuitem');
      move.disabled = !canPlaceEntries(state, ids, target.id);
      swap.disabled = ids.length !== 1 || !canSwapEntries(state, ids[0], target.id);
      swap.title = ids.length > 1 ? 'Для обмена выберите один элемент' : 'Обмен двух элементов';
      const choose = type => {
        hideMenu(menu, { remove: true }); destination.element.classList.remove('has-open-menu', 'is-drop-target'); pendingDrop = null;
        applyDrop(ids, { ...destination, type, referenceId: type === 'swap' ? target.id : null });
      };
      move.addEventListener('click', () => choose('move'));
      swap.addEventListener('click', () => choose('swap'));
      if (target.type === 'folder') menu.append(move);
      menu.append(swap);
      menu.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const items = [...menu.querySelectorAll('button:not(:disabled)')];
        const index = items.indexOf(document.activeElement);
        items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      });
      document.body.append(menu);
      destination.element.classList.add('has-open-menu', 'is-drop-target');
      const box = destination.element.getBoundingClientRect();
      pendingDrop = { ids, destination, menu, point: destination.dropPoint ?? { x: box.left, y: box.bottom } };
      positionDropMenu(); updateSelection();
      showMenu(menu);
      (target.type === 'folder' && !move.disabled ? move : swap).focus({ preventScroll: true });
      showNotice('Выберите действие или нажмите «Отмена».');
    },
  };
}
