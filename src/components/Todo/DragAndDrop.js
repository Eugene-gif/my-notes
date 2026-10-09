export function initDragAndDrop({ root, getEntry, getDragIds = id => [id], canDrop, onDrop, onHoverFolder, onStatus }) {
  let drag = null;
  let target = null;
  let hoverTimer = null;
  let scrollFrame = null;
  let suppressClickUntil = 0;
  let marker = null;
  let holdTimer = null;
  const touchHoldDuration = 300;

  const clearTarget = () => {
    clearTimeout(hoverTimer);
    hoverTimer = null;
    target?.element.classList.remove('is-drop-target', 'is-swap-target');
    marker?.remove();
    marker = null;
    target = null;
  };

  const isHorizontal = element => Number(getComputedStyle(element.closest('.todo__list') || element).getPropertyValue('--columns')) > 1;

  const insertionTarget = (card, x, y) => {
    const entry = getEntry(card.dataset.id);
    if (!entry || drag.ids.includes(entry.id) || card.classList.contains('is-disappearing')) return null;
    const box = card.getBoundingClientRect();
    const horizontal = isHorizontal(card);
    return { element: card, type: 'order', parentId: entry.parentId, referenceId: entry.id, horizontal,
      position: (horizontal ? x < box.left + box.width / 2 : y < box.top + box.height / 2) ? 'before' : 'after' };
  };

  const findTarget = (x, y) => {
    const hit = document.elementFromPoint(x, y);
    if (!hit || !root.contains(hit)) return null;
    const card = hit.closest('.todo__item');
    let destination;
    if (card) {
      const entry = getEntry(card.dataset.id);
      if (!entry || drag.ids.includes(entry.id) || card.classList.contains('is-disappearing')) return null;
      const box = card.getBoundingClientRect();
      const horizontal = isHorizontal(card);
      const edge = Math.min(20, (horizontal ? box.width : box.height) / 4);
      const inside = horizontal ? x > box.left + edge && x < box.right - edge : y > box.top + edge && y < box.bottom - edge;
      const offset = horizontal ? (x - box.left) / box.width : (y - box.top) / box.height;
      destination = drag.ids.length === 1 && entry.type === 'task' && getEntry(drag.id)?.type === 'task' && offset > 0.25 && offset < 0.75
        ? { element: card, type: 'swap', parentId: entry.parentId, referenceId: entry.id }
        : ['folder', 'checklist', 'note'].includes(entry.type) && inside
        ? { element: card, type: 'folder', parentId: entry.id, referenceId: entry.id }
        : insertionTarget(card, x, y);
    } else {
      const list = hit.closest('.todo__list');
      if (list) {
        // В промежутке между карточками выбираем ближайшее место вставки.
        const nearest = [...list.children].filter(item => item.dataset.id && !drag.ids.includes(item.dataset.id) && !item.classList.contains('is-disappearing'))
          .map(item => {
            const box = item.getBoundingClientRect();
            const dx = Math.max(box.left - x, 0, x - box.right);
            const dy = Math.max(box.top - y, 0, y - box.bottom);
            return { item, distance: Math.hypot(dx, dy) };
          }).sort((a, b) => a.distance - b.distance)[0];
        const last = [...list.children].findLast(item => item.dataset.id && !drag.ids.includes(item.dataset.id) && !item.classList.contains('is-disappearing'));
        destination = nearest && nearest.distance <= 24 ? insertionTarget(nearest.item, x, y)
          : isHorizontal(list) && last ? { ...insertionTarget(last, x, y), position: 'after' }
          : { element: list, type: 'order', parentId: list.dataset.dropFolder || null, referenceId: null, position: 'after' };
      } else {
        const element = hit.closest('[data-drop-folder]');
        if (element) destination = { element, type: 'folder', parentId: element.dataset.dropFolder || null };
      }
    }
    if (!destination) return null;
    if (canDrop(drag.ids, destination)) return destination;
    // Задача не может лежать в папке, но через папку можно добраться до другого перечня.
    if (getEntry(drag.id).type === 'task' && destination.type === 'folder'
      && (getEntry(destination.parentId)?.type === 'folder' || destination.element.matches('.todo__path-button'))) {
      return { ...destination, type: 'navigate' };
    }
    return null;
  };

  const positionMarker = () => {
    if (!marker || !target) return;
    const box = target.element.getBoundingClientRect();
    marker.classList.toggle('is-vertical', !!target.horizontal);
    if (target.horizontal) {
      marker.style.left = `${target.position === 'before' ? box.left - 6 : box.right + 4}px`;
      marker.style.top = `${box.top}px`;
      marker.style.width = '3px';
      marker.style.height = `${box.height}px`;
      return;
    }
    marker.style.left = `${box.left}px`;
    marker.style.top = `${target.position === 'before' ? box.top - 6 : box.bottom + 4}px`;
    marker.style.width = `${box.width}px`;
    marker.style.height = '3px';
  };

  const updateTarget = () => {
    const next = findTarget(drag.x, drag.y);
    if (next?.element === target?.element && next?.type === target?.type && next?.position === target?.position) {
      positionMarker();
      return;
    }
    clearTarget();
    target = next;
    if (!target) return;
    if (target.type === 'order') {
      marker = document.createElement('div');
      marker.className = 'todo__drop-marker';
      marker.setAttribute('aria-hidden', 'true');
      document.body.append(marker);
      positionMarker();
      onStatus(`Отпустите, чтобы поставить элемент ${target.referenceId ? target.position === 'before' ? 'перед карточкой' : 'после карточки' : 'в конец списка'}.`);
      return;
    }
    if (target.type === 'swap') {
      target.element.classList.add('is-swap-target');
      onStatus(`Отпустите, чтобы поменять местами с задачей «${getEntry(target.referenceId).value}».`);
      return;
    }
    if (target.type === 'navigate') onStatus('Задержитесь здесь, чтобы открыть раздел. Задачу можно перенести только в перечень.');
    else {
      target.element.classList.add('is-drop-target');
      onStatus(target.referenceId ? getEntry(target.parentId)?.type === 'folder'
        ? 'Отпустите, чтобы выбрать: переместить внутрь или поменять местами.' : 'Отпустите, чтобы выбрать обмен местами.'
        : `Отпустите, чтобы переместить в ${target.parentId ? `«${getEntry(target.parentId).name}»` : '«Главная»'}.`);
    }
    if (target.element.matches('.todo__path-button:not([aria-current="page"])')) {
      const id = target.parentId;
      hoverTimer = setTimeout(() => {
        clearTarget();
        onHoverFolder(id);
        requestAnimationFrame(() => { if (drag?.active) updateTarget(); });
      }, 800);
    }
  };

  const scroll = () => {
    if (!drag?.active) return;
    const edge = 64;
    const speed = drag.y < edge ? -Math.ceil((edge - drag.y) / 4)
      : drag.y > innerHeight - edge ? Math.ceil((drag.y - innerHeight + edge) / 4) : 0;
    if (speed) {
      window.scrollBy(0, speed);
      updateTarget();
    }
    scrollFrame = requestAnimationFrame(scroll);
  };

  const finish = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
    if (!drag) return;
    clearTarget();
    cancelAnimationFrame(scrollFrame);
    drag.ghost?.remove();
    drag.cards.forEach(card => card.classList.remove('is-drag-source'));
    root.classList.remove('is-dragging');
    if (root.hasPointerCapture(drag.pointerId)) root.releasePointerCapture(drag.pointerId);
    drag = null;
  };

  const positionPreview = () => {
    drag.ghost.style.left = `${Math.max(12, Math.min(drag.x + 14, innerWidth - drag.ghost.offsetWidth - 12))}px`;
    drag.ghost.style.top = `${Math.max(12, Math.min(drag.y + 14, innerHeight - drag.ghost.offsetHeight - 12))}px`;
  };

  const startDrag = () => {
    if (!drag || drag.active) return;
    const ids = getDragIds(drag.id);
    if (!ids.length) { finish(); return; }
    drag.ids = ids;
    drag.cards = [...root.querySelectorAll('.todo__item')].filter(item => ids.includes(item.dataset.id));
    drag.active = true;
    root.setPointerCapture(drag.pointerId);
    window.getSelection()?.removeAllRanges();
    drag.cards.forEach(card => card.classList.add('is-drag-source'));
    root.classList.add('is-dragging');
    const entry = getEntry(drag.id);
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'todo__drag-preview';
    drag.ghost.textContent = ids.length > 1 ? `Элементов: ${ids.length}` : entry.type === 'task' ? entry.value : entry.name;
    drag.ghost.setAttribute('aria-hidden', 'true');
    document.body.append(drag.ghost);
    positionPreview();
    scrollFrame = requestAnimationFrame(scroll);
  };

  root.addEventListener('pointerdown', event => {
    // Новый жест разрешает обычный клик сразу после переноса.
    if (event.isPrimary && event.button === 0) suppressClickUntil = 0;
    if (!event.isPrimary || event.button !== 0 || drag) return;
    const card = event.target.closest('.todo__item');
    if (!card || card.classList.contains('is-disappearing')) return;
    if (event.target.closest('input, textarea, .checkbox__label, .folder__options, .folder__menu, .btn-delete-task, .task__expand')) return;
    const entry = getEntry(card.dataset.id);
    if (!entry) return;
    drag = { id: entry.id, ids: [entry.id], cards: [card], pointerId: event.pointerId, pointerType: event.pointerType, card, startX: event.clientX, startY: event.clientY,
      x: event.clientX, y: event.clientY, active: false };
    if (event.pointerType === 'touch') holdTimer = setTimeout(startDrag, touchHoldDuration);
  });

  root.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.active) {
      if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < (drag.pointerType === 'touch' ? 4 : 8)) return;
      // До удержания жест принадлежит нативной прокрутке браузера.
      if (drag.pointerType === 'touch') { finish(); return; }
      startDrag();
      if (!drag) return;
    }
    event.preventDefault();
    positionPreview();
    updateTarget();
  });

  // touch-action позволяет свайп; после удержания блокируем только активный перенос.
  root.addEventListener('touchmove', event => {
    if (drag && !drag.active && drag.pointerType === 'touch') {
      const touch = event.touches[0];
      if (touch && Math.hypot(touch.clientX - drag.startX, touch.clientY - drag.startY) >= 4) finish();
    }
    if (drag?.active && drag.pointerType === 'touch' && event.touches.length === 1 && event.cancelable) event.preventDefault();
  }, { passive: false });
  window.addEventListener('scroll', () => { if (drag && !drag.active) finish(); }, { passive: true });
  root.addEventListener('touchstart', event => { if (event.touches.length > 1) finish(); }, { passive: true });
  root.addEventListener('contextmenu', event => {
    if (event.target.closest('.todo__item[data-id]') && !event.target.closest('input, textarea')) event.preventDefault();
  });

  root.addEventListener('pointerup', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const wasActive = drag.active;
    const destination = wasActive ? findTarget(event.clientX, event.clientY) : null;
    const ids = drag.ids;
    finish();
    if (wasActive) {
      suppressClickUntil = performance.now() + 350;
      if (destination && destination.type !== 'navigate') onDrop(ids, { ...destination, dropPoint: { x: event.clientX, y: event.clientY } });
      else onStatus('Перенос отменён.');
    }
  });

  root.addEventListener('pointercancel', finish);
  root.addEventListener('lostpointercapture', event => {
    // Тач сначала захватывает дочернюю кнопку; перенос захвата на root не отменяет жест.
    if (event.target === root && drag?.active && event.pointerId === drag.pointerId) finish();
  });
  // До начала перетаскивания указатель может покинуть карточку или окно.
  document.addEventListener('pointerup', () => { if (drag && !drag.active) finish(); });
  root.addEventListener('dragstart', event => event.preventDefault());
  root.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drag) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finish();
      suppressClickUntil = performance.now() + 350;
      onStatus('Перенос отменён.');
    }
  }, true);
}
