/**
 * <s-cursor> — A small companion dot that trails the pointer (fine pointers only).
 *
 * Over links/buttons it grows (data-state="link"); over anything inside [data-cursor="Label"] it becomes a
 * disc showing that label (data-state="label"). mix-blend-difference keeps it legible on any background.
 * The native cursor stays visible. Not mounted for coarse pointers or reduced motion.
 */
class Cursor extends HTMLElement {
  #x = -100;
  #y = -100;
  #tx = -100;
  #ty = -100;
  #frame = 0;
  #label = null;
  #controller = null;

  connectedCallback() {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    this.#label = this.querySelector('[data-cursor-label]');
    this.setAttribute('data-ready', '');
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    document.addEventListener('pointermove', this.#onMove, { signal, passive: true });
    document.addEventListener('pointerover', this.#onOver, { signal, passive: true });
    document.documentElement.addEventListener('pointerleave', () => this.removeAttribute('data-visible'), { signal });
  }

  disconnectedCallback() {
    this.#controller?.abort();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  #onMove = (event) => {
    if (event.pointerType !== 'mouse') return;
    this.#tx = event.clientX;
    this.#ty = event.clientY;
    if (!this.hasAttribute('data-visible')) {
      this.#x = this.#tx;
      this.#y = this.#ty;
      this.setAttribute('data-visible', '');
    }
    if (!this.#frame) this.#frame = requestAnimationFrame(this.#tick);
  };

  #tick = () => {
    this.#frame = 0;
    this.#x += (this.#tx - this.#x) * 0.2;
    this.#y += (this.#ty - this.#y) * 0.2;
    this.style.transform = `translate3d(${this.#x}px, ${this.#y}px, 0)`;
    if (Math.abs(this.#tx - this.#x) > 0.1 || Math.abs(this.#ty - this.#y) > 0.1) {
      this.#frame = requestAnimationFrame(this.#tick);
    }
  };

  #onOver = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    // Cards are covered by a stretched link (blocks/card.liquid), so the label lives on a sibling inside the same article.
    const stretched = target.matches('article > a.absolute') ? target.parentElement?.querySelector('[data-cursor]') : null;
    const labelled = target.closest('[data-cursor]') || stretched;
    if (labelled) {
      if (this.#label) this.#label.textContent = labelled.getAttribute('data-cursor') || '';
      this.setAttribute('data-state', 'label');
      return;
    }
    if (target.closest('a, button, [role="button"], label, select, summary')) {
      this.setAttribute('data-state', 'link');
      return;
    }
    this.removeAttribute('data-state');
  };
}

if (!customElements.get('s-cursor')) {
  customElements.define('s-cursor', Cursor);
}
