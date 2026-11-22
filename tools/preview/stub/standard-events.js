// Preview stub for Shopify Standard Events: plain bubbling CustomEvents with the static createPromise() helper the
// real module provides, and a view element that does nothing.
const make = (name) => class extends CustomEvent {
  constructor(detail) { super(name, { detail, bubbles: true, composed: true }); }
  static createPromise() {
    let resolve; let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    promise.catch(() => {});
    return { promise, resolve, reject };
  }
};
export const PageViewEvent = make('shopify:page-view');
export const CollectionUpdateEvent = make('shopify:collection-update');
export const SearchUpdateEvent = make('shopify:search-update');
export const ProductSelectEvent = make('shopify:product-select');
export const createViewEventElement = () => class extends HTMLElement { connectedCallback() {} disconnectedCallback() {} };
