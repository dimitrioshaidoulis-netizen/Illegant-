// Native swipe stays in CSS; indicators resync after scrolling and viewport changes.
class CardGallery extends HTMLElement {
  #controller = null;
  #frame = 0;
  #resize = null;

  connectedCallback() {
    this.#controller = new AbortController();
    const { signal } = this.#controller;
    this.addEventListener('scroll', this.#schedule, { passive: true, signal });
    if ('ResizeObserver' in window) {
      this.#resize = new ResizeObserver(this.#schedule);
      this.#resize.observe(this);
    } else {
      window.addEventListener('resize', this.#schedule, { passive: true, signal });
    }
    this.#sync();
  }

  disconnectedCallback() {
    this.#controller?.abort();
    this.#resize?.disconnect();
    this.#resize = null;
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #schedule = () => {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#sync();
    });
  };

  #sync() {
    const dots = this.parentElement?.querySelectorAll('[data-dot]') ?? [];
    if (!dots.length || !this.clientWidth) return;
    const index = Math.max(0, Math.min(dots.length - 1, Math.round(Math.abs(this.scrollLeft) / this.clientWidth)));
    dots.forEach((dot, i) => dot.toggleAttribute('data-active', i === index));
  }
}

if (!customElements.get('s-card-gallery')) customElements.define('s-card-gallery', CardGallery);
