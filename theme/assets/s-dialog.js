/**
 * <s-dialog> — Dialog Web Component
 * Handles backdrop-click-to-close for native <dialog> modals.
 * Open/close and password visibility are driven by Invoker Commands.
 *
 * Focus management (WCAG 2.4.3):
 *   Captures the native show-modal command source or the active element for a
 *   programmatic showModal(), then restores the original or same-ID replacement.
 *
 * Attributes:
 *   close-on-navigate — close the dialog when an <a> inside it is clicked
 *                       (useful with client-side navigation)
 *   open-on-connect   — open modally after connection (for server-returned feedback)
 *   reset-on-close    — reset forms, password visibility, and marked error state
 *
 * Commands:
 *   --toggle-password — toggle the password input named by event.source aria-controls
 */
/** Scripted exit of overlay panels. The backdrop rule in assets/illegant-flagship.css uses the same values. */
const EXIT_MS = 620;
const EXIT_EASING = 'cubic-bezier(0.5, 0, 0.2, 1)';
/** How long the restored page offset is defended after a close (phone keyboard and browser bars settling). */
const SETTLE_MS = 700;

class SDialog extends HTMLElement {
  #dialog;
  #ac;
  #triggerElement = null;
  #triggerElementId = null;
  #originalShowModal = null;
  #originalClose = null;
  #closing = null;
  #closePosition = null;
  /** Scroll offset before the panel opened. The document is locked while a modal is open, so this is where it must land. */
  #openPosition = null;
  #restoreFrame = 0;
  #cycle = 0;
  /** Stops the short watch that keeps the restored offset in place while the on-screen keyboard folds away. */
  #settle = null;

  connectedCallback() {
    this.#dialog = this.querySelector('dialog');
    if (!this.#dialog) return;

    this.#ac = new AbortController();
    const opts = { signal: this.#ac.signal };

    this.#interceptShowModal();

    // CommandEvent does not bubble, so capture its source on the controlled dialog.
    this.#dialog.addEventListener('command', (e) => {
      if (!(e.source instanceof HTMLElement)) return;

      if (e.command === 'show-modal') {
        e.preventDefault();
        this.#triggerElement = e.source;
        this.#triggerElementId = e.source.id || null;
        this.#dialog.showModal();
        return;
      }
      if (e.command === 'close') {
        e.preventDefault();
        this.#dialog.close();
        return;
      }

      if (e.command === '--toggle-password') {
        e.preventDefault();
        this.#togglePassword(e.source);
      }
    }, opts);

    this.#dialog.addEventListener('cancel', (event) => {
      if (event.defaultPrevented) return;
      // A non-cancelable cancel (repeated Escape without user activation) closes natively; the close handler restores.
      if (!event.cancelable) return;
      event.preventDefault();
      this.#dialog.close();
    }, opts);

    this.#dialog.addEventListener('close', () => {
      // A queued close event from the previous cycle must not reset a freshly reopened panel.
      if (this.#dialog.open) return;
      if (this.hasAttribute('reset-on-close')) this.#resetContent();
      this.#restoreFocus();
      // The native close path (non-cancelable Escape, method="dialog" forms) bypasses the wrapper: fall back to the open offset.
      const position = this.#closePosition || this.#openPosition;
      this.#closePosition = null;
      this.#openPosition = null;
      const cycle = this.#cycle;
      if (position) {
        this.#restoreOffset(position);
        // Native close/focus and root unlock can finish layout in the next frame.
        cancelAnimationFrame(this.#restoreFrame);
        this.#restoreFrame = requestAnimationFrame(() => {
          this.#restoreFrame = 0;
          if (cycle === this.#cycle && !this.#dialog.open) this.#restoreOffset(position);
        });
        this.#holdOffset(position, cycle);
      }
    }, opts);

    this.#dialog.addEventListener('click', (e) => {
      if (e.target === this.#dialog) this.#dialog.close();
    }, opts);

    this.#setupBreakpointListener();

    if (this.hasAttribute('close-on-navigate')) {
      this.addEventListener('click', (e) => {
        if (e.target.closest('a')) this.#dialog.close();
      }, opts);
    }

    if (this.hasAttribute('open-on-connect') && !this.#dialog.open) {
      this.#dialog.showModal();
    }
  }

  disconnectedCallback() {
    this.#ac?.abort();
    this.#cycle++;
    cancelAnimationFrame(this.#restoreFrame);
    this.#settle?.abort();
    this.#closing?.cancel();
    this.#closing = null;
    this.#dialog?.removeAttribute('data-closing');
    // Restore original showModal to support reconnect (DOM move)
    if (this.#dialog && this.#originalShowModal) {
      this.#dialog.showModal = this.#originalShowModal;
      this.#originalShowModal = null;
    }
    if (this.#dialog && this.#originalClose) {
      this.#dialog.close = this.#originalClose;
      this.#originalClose = null;
    }
  }

  #interceptShowModal() {
    if (this.#originalShowModal) return;
    this.#originalShowModal = this.#dialog.showModal.bind(this.#dialog);
    this.#dialog.showModal = (...args) => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement
        && activeElement !== document.body
        && activeElement !== document.documentElement
        && !this.#triggerElement
      ) {
        this.#triggerElement = activeElement;
        this.#triggerElementId = activeElement.id || null;
      }
      this.#cycle++;
      cancelAnimationFrame(this.#restoreFrame);
      this.#settle?.abort();
      this.#closePosition = null;
      if (this.#closing) {
        this.#closing.cancel();
        this.#closing = null;
        this.#dialog.removeAttribute('data-closing');
      }
      if (this.#dialog.open) return;
      // Stop pending homepage motion before autofocus can move the document.
      this.#dialog.dispatchEvent(new Event('s-dialog:opening', { bubbles: true }));
      const left = window.scrollX;
      const top = window.scrollY;
      // Record once per open cycle (a reopen during the exit animation keeps the original offset).
      if (!this.#openPosition) this.#openPosition = { left, top };
      const result = this.#originalShowModal(...args);
      this.#restoreOffset({ left, top });
      return result;
    };
    this.#originalClose = this.#dialog.close.bind(this.#dialog);
    this.#dialog.close = (...args) => {
      if (!this.#dialog.open || this.#closing) return;
      // Land on the offset from before opening: iOS scrolls the locked page for the on-screen keyboard, and keeping
      // that shift made the page jump up after every search.
      const position = this.#openPosition || { left: window.scrollX, top: window.scrollY };
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !this.#dialog.classList.contains('overlay-panel') || !this.#dialog.animate) {
        this.#finishClose(args, position);
        return;
      }
      const style = getComputedStyle(this.#dialog);
      const closed = style.getPropertyValue('--panel-closed-transform').trim() || 'none';
      // A field left focused keeps the phone keyboard up until the panel has gone, and the browser then moves the
      // page while the keyboard folds away, after the offset was restored. Let it fold away during the exit instead.
      const focused = document.activeElement;
      if (focused instanceof HTMLElement && focused !== this.#dialog && this.#dialog.contains(focused)
        && focused.matches('input, textarea, select, [contenteditable]')) {
        focused.blur();
      }
      // Exit: the panel answers the tap on the first frame but leaves at an unhurried pace, and stays fully opaque
      // until it is nearly off screen. Measured before this change (480ms, CSS ease): a full-screen sheet covered
      // 54% of its travel in 150ms and was gone by 300ms, less than half the time it takes to open (750ms).
      // Keep duration/easing in step with the backdrop rule "Panel exit" in assets/illegant-flagship.css.
      const animation = this.#dialog.animate([
        { opacity: style.opacity, transform: style.transform, offset: 0 },
        { opacity: style.opacity, offset: 0.8 },
        { opacity: 0, transform: closed, offset: 1 }
      ], {
        duration: EXIT_MS,
        easing: EXIT_EASING,
        fill: 'forwards'
      });
      this.#closing = animation;
      this.#dialog.setAttribute('data-closing', '');
      // Keep [open], modality and document lock until the visible exit has finished.
      animation.finished.then(() => {
        if (this.#closing !== animation || this.#ac.signal.aborted) return;
        // [data-closing] stays on through the native close so CSS skips its own (second) exit transition:
        // the panel is already invisible and must leave the top layer at once instead of lingering and
        // swallowing taps.
        this.#finishClose(args, position);
        animation.cancel();
        this.#closing = null;
        requestAnimationFrame(() => {
          if (!this.#dialog.open) this.#dialog.removeAttribute('data-closing');
        });
      }).catch(() => {});
    };
  }

  #finishClose(args, position) {
    this.#closePosition = position;
    this.#originalClose(...args);
    this.#restoreOffset(position);
  }

  /**
   * Puts the page back on the given offset, only when it has actually moved. A scroll to the offset the page
   * already rests on is not free: on the homepage (CSS scroll snap on touch screens) it makes the browser
   * re-evaluate its snap position.
   */
  #restoreOffset({ left, top }) {
    if (Math.abs(window.scrollX - left) < 1 && Math.abs(window.scrollY - top) < 1) return;
    window.scrollTo({ left, top, behavior: 'instant' });
  }

  /**
   * After a panel closes, phones can still move the page for a moment (the keyboard folding away, the browser bars
   * returning). For a short while, put the page back whenever that happens, and stop at once when the visitor
   * touches, wheels or types: from then on the page is theirs.
   */
  #holdOffset(position, cycle) {
    this.#settle?.abort();
    const settle = new AbortController();
    this.#settle = settle;
    const { signal } = settle;
    const stop = () => settle.abort();
    const put = () => {
      if (signal.aborted) return;
      if (cycle !== this.#cycle || this.#dialog.open || document.querySelector('dialog[open]')) { stop(); return; }
      this.#restoreOffset(position);
    };
    for (const type of ['touchstart', 'wheel', 'keydown', 'pointerdown']) {
      window.addEventListener(type, stop, { passive: true, capture: true, signal });
    }
    window.addEventListener('scroll', put, { passive: true, signal });
    window.visualViewport?.addEventListener('resize', put, { signal });
    window.visualViewport?.addEventListener('scroll', put, { signal });
    const timer = setTimeout(stop, SETTLE_MS);
    signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  }

  #togglePassword(source) {
    const inputId = source.getAttribute('aria-controls');
    const input = inputId ? document.getElementById(inputId) : null;
    if (!(input instanceof HTMLInputElement) || !this.#dialog.contains(input)) return;
    if (input.type !== 'password' && input.type !== 'text') return;

    const reveal = input.type === 'password';
    const label = reveal ? source.dataset.hideLabel : source.dataset.showLabel;
    input.type = reveal ? 'text' : 'password';
    source.setAttribute('aria-pressed', String(reveal));

    const labelElement = source.querySelector('[data-password-toggle-label]');
    if (label && labelElement) labelElement.textContent = label;
  }

  #resetContent() {
    const form = this.#dialog.closest('form');
    form?.reset();

    for (const source of this.#dialog.querySelectorAll('button[command="--toggle-password"]')) {
      const inputId = source.getAttribute('aria-controls');
      const input = inputId ? document.getElementById(inputId) : null;
      if (input instanceof HTMLInputElement && this.#dialog.contains(input)) input.type = 'password';
      source.setAttribute('aria-pressed', 'false');

      const label = source.dataset.showLabel;
      const labelElement = source.querySelector('[data-password-toggle-label]');
      if (label && labelElement) labelElement.textContent = label;
    }

    const errors = [...this.#dialog.querySelectorAll('[data-dialog-error]')];
    const errorIds = new Set(errors.map((error) => error.id).filter(Boolean));
    for (const error of errors) error.hidden = true;

    for (const control of this.#dialog.querySelectorAll('[aria-invalid="true"]')) {
      control.removeAttribute('aria-invalid');
      const describedBy = (control.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && !errorIds.has(id));
      if (describedBy.length > 0) control.setAttribute('aria-describedby', describedBy.join(' '));
      else control.removeAttribute('aria-describedby');
    }
  }

  #restoreFocus() {
    const trigger = this.#triggerElement;
    const triggerId = this.#triggerElementId;
    this.#triggerElement = null;
    this.#triggerElementId = null;

    if (document.querySelector('dialog[open]')) return;
    if (this.#canRestoreFocus(trigger)) {
      trigger.focus({ preventScroll: true });
      return;
    }

    const replacement = triggerId ? document.getElementById(triggerId) : null;
    if (this.#canRestoreFocus(replacement)) replacement.focus({ preventScroll: true });
  }

  #canRestoreFocus(element) {
    return element instanceof HTMLElement
      && element.isConnected
      && element !== document.body
      && element !== document.documentElement
      && !element.hidden;
  }

  #setupBreakpointListener() {
    const breakpoints = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem' };

    for (const [bp, width] of Object.entries(breakpoints)) {
      if (this.#dialog.classList.contains(`${bp}:hidden`)) {
        const mq = window.matchMedia(`(min-width: ${width})`);
        const handler = (e) => { if (e.matches && this.#dialog.open) this.#dialog.close(); };
        mq.addEventListener('change', handler);
        this.#ac.signal.addEventListener('abort', () => mq.removeEventListener('change', handler));
        return;
      }
      if (this.#dialog.classList.contains(`max-${bp}:hidden`)) {
        const mq = window.matchMedia(`(width < ${width})`);
        const handler = (e) => { if (e.matches && this.#dialog.open) this.#dialog.close(); };
        mq.addEventListener('change', handler);
        this.#ac.signal.addEventListener('abort', () => mq.removeEventListener('change', handler));
        return;
      }
    }
  }
}

customElements.define('s-dialog', SDialog);
