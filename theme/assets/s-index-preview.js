/**
 * <s-index-preview> — A catalogue index whose rows float a framed preview of the
 * piece beside the cursor.
 *
 * Child markup:
 *   [data-preview-src] — rows carrying the preview image URL (rows without one show nothing).
 *   img[data-preview]  — the single floating image; positioned with a physical
 *                         translate because it follows clientX/clientY.
 *
 * Fine pointers only. With reduced motion the image appears at the cursor
 * without easing. Rows stay plain links everywhere else.
 */
class IndexPreview extends HTMLElement {
  #controller = null;
  #frame = 0;
  #target = { x: 0, y: 0 };
  #current = { x: 0, y: 0 };

  connectedCallback() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener(
      'pointermove',
      (event) => {
        this.#target.x = event.clientX;
        this.#target.y = event.clientY;
        const row = event.target instanceof Element ? event.target.closest('[data-preview-src]') : null;
        const preview = this.querySelector('img[data-preview]');
        if (!(preview instanceof HTMLImageElement)) return;

        const src = row?.getAttribute('data-preview-src');
        if (!src) {
          preview.removeAttribute('data-visible');
          return;
        }
        if (preview.getAttribute('src') !== src) preview.setAttribute('src', src);
        if (!preview.hasAttribute('data-visible')) {
          // Start from the cursor so the first appearance does not sweep across the screen.
          this.#current.x = this.#target.x;
          this.#current.y = this.#target.y;
          preview.setAttribute('data-visible', '');
        }
        this.#tick(preview, reduceMotion);
      },
      { signal }
    );

    this.addEventListener(
      'pointerleave',
      () => this.querySelector('img[data-preview]')?.removeAttribute('data-visible'),
      { signal }
    );
  }

  disconnectedCallback() {
    this.#controller?.abort();
    cancelAnimationFrame(this.#frame);
  }

  /**
   * @param {HTMLImageElement} preview
   * @param {boolean} reduceMotion
   */
  #tick(preview, reduceMotion) {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => {
      const ease = reduceMotion ? 1 : 0.18;
      this.#current.x += (this.#target.x - this.#current.x) * ease;
      this.#current.y += (this.#target.y - this.#current.y) * ease;
      preview.style.transform = `translate3d(${this.#current.x + 28}px, ${this.#current.y - preview.offsetHeight / 2}px, 0)`;
      const moving = Math.abs(this.#target.x - this.#current.x) + Math.abs(this.#target.y - this.#current.y) > 0.5;
      if (moving) this.#tick(preview, reduceMotion);
    });
  }
}

if (!customElements.get('s-index-preview')) {
  customElements.define('s-index-preview', IndexPreview);
}
