/**
 * <s-reveal> — Opens its content like a curtain the first time it scrolls into view.
 *
 * Sets [data-armed] on connect (so the closed state only exists when JS runs) and
 * [data-revealed] once at least 15% is visible. Styling lives in the markup:
 *   data-[armed]:not-data-[revealed]:… for the closed clip, and
 *   group-data-[revealed]/reveal:… on children for the settled state.
 * Reduced-motion visitors get the open state immediately.
 */
class Reveal extends HTMLElement {
  #observer = null;

  connectedCallback() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.setAttribute('data-revealed', '');
      return;
    }

    this.setAttribute('data-armed', '');
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.setAttribute('data-revealed', '');
          this.#observer?.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }
}

if (!customElements.get('s-reveal')) {
  customElements.define('s-reveal', Reveal);
}
