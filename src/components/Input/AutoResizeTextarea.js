export function initAutoResizeTextareas(root, selector = 'textarea[data-autoresize]') {
  const fields = [...root.querySelectorAll(selector)];
  const widths = new WeakMap();
  const resize = area => {
    if (!area.getClientRects().length) return;
    const boundary = area.closest('[data-textarea-boundary]');
    if (boundary) {
      const panelStyles = getComputedStyle(boundary);
      const occupied = [...boundary.children].filter(child => child !== area).reduce((height, child) => {
        const style = getComputedStyle(child);
        return height + child.getBoundingClientRect().height + (parseFloat(style.marginTop) || 0) + (parseFloat(style.marginBottom) || 0);
      }, 0);
      const areaStyles = getComputedStyle(area);
      const spacing = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((sum, key) => sum + (parseFloat(panelStyles[key]) || 0), 0)
        + (parseFloat(areaStyles.marginTop) || 0) + (parseFloat(areaStyles.marginBottom) || 0);
      const available = Math.max(0, parseFloat(panelStyles.maxHeight) - occupied - spacing);
      area.style.setProperty('--textarea-available-height', `${available}px`);
    }
    area.style.overflowY = 'hidden';
    area.style.height = 'auto';
    const styles = getComputedStyle(area);
    const min = parseFloat(styles.minHeight) || 0;
    const max = parseFloat(styles.maxHeight) || Infinity;
    const border = (parseFloat(styles.borderTopWidth) || 0) + (parseFloat(styles.borderBottomWidth) || 0);
    const needed = area.scrollHeight + border;
    const height = Math.max(min, Math.min(needed, max));
    area.style.height = `${height}px`;
    area.style.overflowY = needed > height ? 'auto' : 'hidden';
  };
  const resizeAll = () => fields.forEach(resize);
  const onInput = event => resize(event.currentTarget);
  const observer = new ResizeObserver(entries => {
    entries.forEach(({ target, contentRect }) => {
      if (widths.get(target) === contentRect.width) return;
      widths.set(target, contentRect.width);
      resize(target);
    });
  });
  fields.forEach(area => { area.addEventListener('input', onInput); observer.observe(area); });
  window.addEventListener('resize', resizeAll);
  window.visualViewport?.addEventListener('resize', resizeAll);
  resizeAll();
  return {
    resize: resizeAll,
    destroy: () => {
      observer.disconnect();
      fields.forEach(area => area.removeEventListener('input', onInput));
      window.removeEventListener('resize', resizeAll);
      window.visualViewport?.removeEventListener('resize', resizeAll);
    },
  };
}
