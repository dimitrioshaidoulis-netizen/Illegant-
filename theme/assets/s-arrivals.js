/**
 * <s-arrivals> — Plays each arrival effect once, in full, when its element reaches the screen.
 *
 * Placed once in the layout. Watches every element matching ARRIVAL_SELECTOR and sets [data-arrived] on it:
 *   .curtain  — photograph opens from a framed crop, .rise titles follow
 *   .manifesto — words ink in one after another (--i)
 *   .wipe-up / .wipe-side — photograph uncovers upward / from the start edge
 *   .stagger  — direct children rise in turn (--i)
 *   .lines    — text lines rise in turn
 *   .letters  — each .letter rises in turn (--i)
 * Elements added later (editor re-renders, partial swaps) are picked up too.
 * The hidden "before" states only apply under html.arrivals-ready, so without JavaScript or with
 * reduced motion everything simply shows.
 */
const ARRIVAL_SELECTOR = '.curtain, .dusk, .manifesto, .wipe-up, .wipe-side, .stagger, .lines, .letters';

class Arrivals extends HTMLElement {
  #observer = null;
  #mutations = null;

  connectedCallback() {
    // Never hide content again after the slow-load fallback has revealed it.
    if (document.documentElement.classList.contains('arrivals-off')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.toggleAttribute('data-arrived', true);
          this.#observer?.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    this.#watch(document);
    this.#mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) this.#watch(node);
        }
      }
    });
    this.#mutations.observe(document.body, { childList: true, subtree: true });
    document.documentElement.classList.add('arrivals-ready');
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#mutations?.disconnect();
    this.#observer = null;
    this.#mutations = null;
  }

  /** @param {Document | Element} root */
  #watch(root) {
    const found = root instanceof Element && root.matches(ARRIVAL_SELECTOR) ? [root] : [];
    found.push(...root.querySelectorAll(ARRIVAL_SELECTOR));
    for (const element of found) {
      if (!element.hasAttribute('data-arrived')) this.#observer?.observe(element);
    }
  }
}

if (!customElements.get('s-arrivals')) customElements.define('s-arrivals', Arrivals);
