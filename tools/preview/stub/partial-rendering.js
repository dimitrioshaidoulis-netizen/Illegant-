// Preview stub for Shopify's partial-rendering module: no server, so fetch returns nothing and apply is a no-op.
export const partials = {
  async fetch() { return ''; },
  apply() {}
};
