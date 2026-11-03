/**
 * <s-header-scroll> — Scroll states for the site header it sits in.
 *
 * Sets on the closest <header>:
 *   data-scrolled  once the page has left the very top (glass bar, condensed logo).
 *   data-hidden    while scrolling down on inner pages; cleared when scrolling up, at the top,
 *                  when focus enters the header, or while any dialog is open.
 * The homepage (screens sized under the header) never hides the bar, so its screens stay aligned.
 * Only toggles attributes; motion lives in config/styles.css and is zeroed for reduced motion.
 */
class HeaderScroll extends HTMLElement {
  #header = null;
  #controller = null;
  #frame = 0;
  #lastY = 0;
  #canHide = true;

  connectedCallback() {
    this.#header = this.closest('header');
    if (!this.#header) return;
    this.#canHide = !document.querySelector('.home-screen');
    this.#lastY = window.scrollY;
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    window.addEventListener('scroll', this.#onScroll, { passive: true, signal });
    this.#header.addEventListener('focusin', () => this.#header.removeAttribute('data-hidden'), { signal });
    this.#update();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    cancelAnimationFrame(this.#frame);
  }

  #onScroll = () => {
    if (this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#update();
    });
  };

  #update() {
    const y = Math.max(0, window.scrollY);
    this.#header.toggleAttribute('data-scrolled', y > 4);

    if (this.#canHide) {
      const delta = y - this.#lastY;
      const dialogOpen = Boolean(document.querySelector('dialog[open]'));
      if (y < 120 || dialogOpen || delta < -6) this.#header.removeAttribute('data-hidden');
      else if (delta > 6) this.#header.setAttribute('data-hidden', '');
    }
    if (Math.abs(y - this.#lastY) > 6 || y < 120) this.#lastY = y;
  }
}

if (!customElements.get('s-header-scroll')) customElements.define('s-header-scroll', HeaderScroll);
