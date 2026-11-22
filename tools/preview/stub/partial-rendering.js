// Preview stub for Shopify's partial-rendering module: no server, so fetch records the request and returns nothing,
// and apply is a no-op. Tests read window.__partialFetches to see what a component asked the server for.
export const partials = {
  async fetch(...args) {
    (window.__partialFetches ||= []).push({ names: args.filter((a) => typeof a === 'string'), url: args.find((a) => a && typeof a === 'object')?.url || '' });
    return '';
  },
  apply() {}
};
