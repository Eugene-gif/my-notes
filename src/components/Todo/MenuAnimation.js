const animations = new WeakMap();

function animateMenu(menu, frames, onFinish, visual = menu) {
  const previous = animations.get(menu);
  previous?.animation.cancel();
  previous?.cleanup();
  const value = getComputedStyle(menu).getPropertyValue('--menu-animation-duration').trim();
  const duration = parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !duration) {
    animations.delete(menu);
    if (visual !== menu) visual.remove();
    onFinish?.();
    return;
  }
  const animation = visual.animate(frames, { duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
  const record = { animation, cleanup: () => { if (visual !== menu) visual.remove(); } };
  animations.set(menu, record);
  animation.finished.then(() => {
    if (animations.get(menu) !== record) return;
    animations.delete(menu);
    record.cleanup();
    onFinish?.();
  }).catch(() => {});
}

export function showMenu(menu) {
  const previous = animations.has(menu) ? getComputedStyle(animations.get(menu).animation.effect.target) : null;
  const from = previous ? { opacity: previous.opacity, transform: previous.transform } : { opacity: 0, transform: 'translateY(-6px) scale(0.98)' };
  menu.hidden = false;
  menu.inert = false;
  menu.classList.remove('is-menu-closing');
  animateMenu(menu, [from, { opacity: 1, transform: 'translateY(0) scale(1)' }]);
}

export function hideMenu(menu, { remove = false, onHidden } = {}) {
  const styles = getComputedStyle(menu);
  const box = menu.getBoundingClientRect();
  const from = { opacity: styles.opacity, transform: 'translateY(0) scale(1)' };
  // Визуальная копия позволяет завершить исчезновение даже при перерисовке списка.
  const visual = menu.cloneNode(true);
  visual.removeAttribute('id');
  visual.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
  visual.hidden = false;
  visual.inert = true;
  visual.setAttribute('aria-hidden', 'true');
  visual.classList.add('is-menu-closing', 'menu-exit-visual');
  visual.classList.remove('todo__drop-choice', 'todo__toolbar-menu');
  visual.querySelectorAll('[data-toolbar-action], [data-folder-action], [data-task-action]').forEach(node => {
    for (const attribute of ['data-toolbar-action', 'data-folder-action', 'data-task-action']) node.removeAttribute(attribute);
  });
  Object.assign(visual.style, { position: 'fixed', left: `${box.left}px`, top: `${box.top}px`, right: 'auto', width: `${box.width}px`, maxWidth: 'none', zIndex: '10000', pointerEvents: 'none' });
  document.body.append(visual);
  menu.inert = true;
  menu.hidden = true;
  menu.classList.add('is-menu-closing');
  animateMenu(menu, [from, { opacity: 0, transform: 'translateY(-4px) scale(0.98)' }], () => {
    if (remove) menu.remove();
    else menu.hidden = true;
    menu.classList.remove('is-menu-closing');
    onHidden?.();
  }, visual);
}
