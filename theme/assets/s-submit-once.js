/**
 * <s-submit-once> — Wraps one native Shopify form (customer, contact). The form still posts the normal way; this only:
 *   - blocks a second submit while the first is on its way (double tap on a slow phone connection),
 *   - marks the submit button busy (aria-busy, aria-disabled) and swaps its label for data-busy-label,
 *   - tags a sign-up with the campaign it arrived from (utm_source in the current address only, nothing stored),
 *     when the form carries data-campaign-tag on its contact[tags] input,
 *   - restores the button when the browser brings the page back from its cache (back button).
 * Invalid fields never reach this: the browser's own validation stops the submit event first.
 */
class SubmitOnce extends HTMLElement {
  #busy = false;
  #label = '';

  connectedCallback() {
    this.addEventListener('submit', this.#onSubmit);
    window.addEventListener('pageshow', this.#onPageShow);
  }

  disconnectedCallback() {
    this.removeEventListener('submit', this.#onSubmit);
    window.removeEventListener('pageshow', this.#onPageShow);
  }

  /** @param {SubmitEvent} event */
  #onSubmit = (event) => {
    if (this.#busy) {
      event.preventDefault();
      return;
    }
    const form = /** @type {HTMLFormElement} */ (event.target);
    this.#busy = true;
    this.#tagCampaign(form);
    const button = this.#button(form);
    if (!button) return;
    this.#label = button.innerHTML;
    button.setAttribute('aria-busy', 'true');
    button.setAttribute('aria-disabled', 'true');
    if (this.dataset.busyLabel) button.textContent = this.dataset.busyLabel;
  };

  #onPageShow = (/** @type {PageTransitionEvent} */ event) => {
    if (!event.persisted || !this.#busy) return;
    this.#busy = false;
    const button = this.#button(this.querySelector('form'));
    if (!button) return;
    button.removeAttribute('aria-busy');
    button.removeAttribute('aria-disabled');
    if (this.#label) button.innerHTML = this.#label;
  };

  /** @param {HTMLFormElement | null} form */
  #button(form) {
    return form?.querySelector('button[type="submit"], button:not([type])') ?? null;
  }

  /** @param {HTMLFormElement} form */
  #tagCampaign(form) {
    const input = /** @type {HTMLInputElement | null} */ (form.querySelector('input[name="contact[tags]"][data-campaign-tag]'));
    if (!input) return;
    const source = new URLSearchParams(window.location.search).get('utm_source') || '';
    const slug = source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
    if (slug && !input.value.includes(`src-${slug}`)) input.value = `${input.value}, src-${slug}`;
  }
}

if (!customElements.get('s-submit-once')) {
  customElements.define('s-submit-once', SubmitOnce);
}
