// Preview stub for Shopify Standard Events: plain bubbling CustomEvents, and a view element that does nothing.
const make = (name) => class extends CustomEvent { constructor(detail) { super(name, { detail, bubbles: true, composed: true }); } };
export const PageViewEvent = make('shopify:page-view');
export const CollectionUpdateEvent = make('shopify:collection-update');
export const SearchUpdateEvent = make('shopify:search-update');
export const ProductSelectEvent = make('shopify:product-select');
export const createViewEventElement = () => class extends HTMLElement { connectedCallback() {} disconnectedCallback() {} };
