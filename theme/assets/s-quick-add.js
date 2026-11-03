/**
 * <s-quick-add> — Size strip on collection cards: one press adds that size to the real cart.
 *
 * Buttons: button[data-variant-id]. Uses Standard Actions (window.Shopify.actions.updateCart), the same path as
 * s-product-form, then opens the cart. When Standard Actions are unavailable, or the add fails, it falls back to
 * the product page with that variant selected (data-product-url), so a shopper is never stranded.
 */
class QuickAdd extends HTMLElement {
  #controller = null;
  #busy = false;

  connectedCallback() {
    this.#controller = new AbortController();
    this.addEventListener('click', this.#onClick, { signal: this.#controller.signal });
  }

  disconnectedCallback() {
    this.#controller?.abort();
  }

  #fallback(variantId) {
    const url = this.dataset.productUrl;
    if (!url) return;
    const target = new URL(url, window.location.origin);
    target.searchParams.set('variant', variantId);
    window.location.assign(target.toString());
  }

  #onClick = async (event) => {
    const button = event.target instanceof Element ? event.target.closest('button[data-variant-id]') : null;
    if (!button || button.getAttribute('aria-disabled') === 'true' || this.#busy) return;
    const variantId = button.getAttribute('data-variant-id');
    const actions = window.Shopify?.actions;
    if (!actions?.updateCart) {
      this.#fallback(variantId);
      return;
    }

    this.#busy = true;
    this.setAttribute('aria-busy', 'true');
    button.setAttribute('data-pressed', '');
    try {
      const result = await actions.updateCart(
        { lines: [{ merchandiseId: variantId, quantity: 1 }] },
        { event: { context: 'collection', detail: { source: 's-quick-add' } } }
      );
      if (result?.userErrors?.length) {
        this.#fallback(variantId);
        return;
      }
      await actions.openCart?.();
    } catch {
      this.#fallback(variantId);
    } finally {
      this.#busy = false;
      this.removeAttribute('aria-busy');
      button.removeAttribute('data-pressed');
    }
  };
}

if (!customElements.get('s-quick-add')) {
  customElements.define('s-quick-add', QuickAdd);
}
