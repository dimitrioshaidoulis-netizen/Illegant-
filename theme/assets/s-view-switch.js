/**
 * <s-view-switch> — Switches a listing between two hangs ("wall" and "index").
 *
 * Writes data-view on itself; descendants show/hide with
 * group-data-[view=…]/views utilities, so content swapped in by partial
 * rendering inherits the current view with no re-initialisation.
 *
 * Child markup:
 *   button[data-view-option="wall|index"] — toggles; aria-pressed is kept in sync.
 * The choice persists in localStorage under "illegant-view".
 */
const STORAGE_KEY = 'illegant-view';

class ViewSwitch extends HTMLElement {
  #controller = null;

  connectedCallback() {
    this.#controller = new AbortController();
    let saved = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved === 'wall' || saved === 'index') this.#apply(saved);

    this.addEventListener(
      'click',
      (event) => {
        const target = event.target instanceof Element ? event.target.closest('[data-view-option]') : null;
        if (!target || !this.contains(target)) return;
        const view = target.getAttribute('data-view-option');
        if (view !== 'wall' && view !== 'index') return;
        this.#apply(view);
        try {
          window.localStorage.setItem(STORAGE_KEY, view);
        } catch {
          /* storage unavailable: the choice lasts for this page only */
        }
      },
      { signal: this.#controller.signal }
    );
  }

  disconnectedCallback() {
    this.#controller?.abort();
  }

  /** @param {'wall' | 'index'} view */
  #apply(view) {
    this.dataset.view = view;
    for (const option of this.querySelectorAll('[data-view-option]')) {
      option.setAttribute('aria-pressed', String(option.getAttribute('data-view-option') === view));
    }
  }
}

if (!customElements.get('s-view-switch')) {
  customElements.define('s-view-switch', ViewSwitch);
}
