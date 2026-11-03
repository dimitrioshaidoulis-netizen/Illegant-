class E extends Event { constructor(t = 'x', d = {}) { super(typeof t === 'string' ? t : 'x'); Object.assign(this, d); } }
export class CollectionUpdateEvent extends E {} export class PageViewEvent extends E {} export class ProductSelectEvent extends E {} export class SearchUpdateEvent extends E {}
export const createViewEventElement = () => class extends HTMLElement { connectedCallback() {} disconnectedCallback() {} };
export default {};
