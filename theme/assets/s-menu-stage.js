// Keep photo changes deliberate: mouse intent is delayed, keyboard focus is immediate.
class MenuStage extends HTMLElement {
  #controller = null;
  #intent = 0;
  #pending = null;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    this.addEventListener('pointerover', this.#onEnter, { signal });
    this.addEventListener('focusin', this.#onEnter, { signal });
    this.addEventListener('pointerleave', () => {
      this.#cancelIntent();
      this.removeAttribute('data-hovering');
    }, { signal });
    this.addEventListener('click', this.#onClick, { signal });
    this.closest('dialog')?.addEventListener('close', () => {
      this.#cancelIntent();
      this.removeAttribute('data-hovering');
    }, { signal });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#cancelIntent();
  }

  #cancelIntent() {
    clearTimeout(this.#intent);
    this.#pending = null;
  }

  #onClick = (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('[data-menu-handoff]')) {
      this.closest('dialog')?.close();
      return;
    }
    const link = event.target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
    this.closest('dialog')?.close();
  };

  #onEnter = (event) => {
    if (event.type === 'pointerover' && event.pointerType !== 'mouse') return;
    const link = event.target instanceof Element ? event.target.closest('[data-menu-target]') : null;
    if (!link) {
      this.#cancelIntent();
      if (!(event.target instanceof Element && event.target.closest('.site-menu__item'))) {
        this.removeAttribute('data-hovering');
      }
      return;
    }
    if (event.type === 'focusin') {
      this.#cancelIntent();
      this.#activate(link);
      return;
    }
    // Child pointerover events must not restart the same intent timer.
    if (this.#pending === link) return;
    this.#cancelIntent();
    this.#pending = link;
    this.#intent = setTimeout(() => {
      this.#pending = null;
      if (link.isConnected) this.#activate(link);
    }, 140);
  };

  #activate(link) {
    this.setAttribute('data-hovering', '');
    const index = link.getAttribute('data-menu-target');
    for (const item of this.querySelectorAll('.site-menu__item')) {
      item.toggleAttribute('data-active', item.contains(link));
    }
    for (const photo of this.querySelectorAll('[data-menu-photo]')) {
      photo.toggleAttribute('data-current', photo.getAttribute('data-menu-photo') === index);
    }
  }
}

if (!customElements.get('s-menu-stage')) customElements.define('s-menu-stage', MenuStage);
