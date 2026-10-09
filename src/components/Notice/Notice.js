import './Notice.css';

const icons = {
  success: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6m0-6-6 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.5" r=".7" fill="currentColor" stroke="none"/>',
};

/** Create a configurable notification host. See Notice.md for API and styling. */
export function createNotice({ duration = 2000, closable = true, top = '20px', width = '460px', container = document.body } = {}) {
  const host = document.createElement('div');
  host.className = 'notice-host';
  host.hidden = true;
  host.setAttribute('popover', 'manual');
  host.setAttribute('aria-atomic', 'true');
  host.setAttribute('aria-live', 'polite');
  host.style.setProperty('--notice-top', top);
  host.style.setProperty('--notice-width', width);
  container.append(host);
  let timer, removalTimer, previousFocus;
  let destroyed = false;

  const hide = () => {
    clearTimeout(timer);
    clearTimeout(removalTimer);
    if (typeof host.hidePopover === 'function' && host.matches(':popover-open')) host.hidePopover();
    host.hidden = true;
    host.replaceChildren();
  };
  const mount = () => {
    // A modal makes nodes outside itself inert, including top-layer popovers.
    const parent = [...document.querySelectorAll('dialog[open]')].at(-1) ?? container;
    if (host.parentElement === parent) return;
    if (typeof host.hidePopover === 'function' && host.matches(':popover-open')) host.hidePopover();
    parent.append(host);
    if (!host.hidden && typeof host.showPopover === 'function') host.showPopover();
  };
  const observer = new MutationObserver(() => { if (!destroyed && !host.hidden) mount(); });
  observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['open'] });
  const close = () => {
    if (host.hidden || host.classList.contains('is-closing')) return;
    clearTimeout(timer);
    if (host.contains(document.activeElement) && previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus({ preventScroll: true });
    host.classList.add('is-closing');
    removalTimer = setTimeout(hide, 160);
  };
  const show = ({ message, status = 'info', duration: timeout = duration, closable: canClose = closable }) => {
    if (destroyed) throw new Error('Notice has been destroyed');
    if (!Object.hasOwn(icons, status)) throw new TypeError(`Unknown notice status: ${status}`);
    if (!Number.isFinite(timeout) || timeout < 0) throw new TypeError('Notice duration must be a non-negative number');
    hide();
    mount();
    previousFocus = document.activeElement;
    host.classList.remove('is-closing');
    host.dataset.status = status;
    host.setAttribute('role', status === 'error' ? 'alert' : 'status');
    host.setAttribute('aria-live', status === 'error' ? 'assertive' : 'polite');
    const card = document.createElement('div');
    card.className = 'notice';
    const icon = document.createElement('span');
    icon.className = 'notice__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[status]}</svg>`;
    const text = document.createElement('span');
    text.className = 'notice__text';
    text.textContent = String(message ?? '');
    card.append(icon, text);
    if (canClose) {
      const button = document.createElement('button');
      button.className = 'notice__close';
      button.type = 'button';
      button.setAttribute('aria-label', 'Закрыть уведомление');
      button.innerHTML = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>';
      button.addEventListener('click', close);
      card.append(button);
    }
    host.append(card);
    host.hidden = false;
    // The top layer keeps notices visible above native modal dialogs.
    if (typeof host.showPopover === 'function') host.showPopover();
    if (timeout > 0) timer = setTimeout(close, timeout);
  };
  return {
    show,
    success: (message, options = {}) => show({ ...options, message, status: 'success' }),
    error: (message, options = {}) => show({ ...options, message, status: 'error' }),
    info: (message, options = {}) => show({ ...options, message, status: 'info' }),
    close,
    destroy: () => { hide(); observer.disconnect(); host.remove(); destroyed = true; },
  };
}
