# Local theme preview

Renders the real templates and layout of `theme/` with LiquidJS plus Shopify-dialect tags (`block`, `partial`, `form`,
`paginate`, `render`) and mock data, so pages can be screenshotted and interacted with without Shopify.
It approximates Shopify: platform scripts are stubbed, photos are generated stand-ins labelled with the real
filename, prices/products are mock data and never published anywhere.

    npm i liquidjs@10 playwright      # or symlink an existing node_modules
    python3 gen-images.py out/img out/image-names.json   # after one render (writes image-names.json)
    node render.js ../../theme out    # EMPTY_STORE=1 for an empty catalogue, SIZE_GUIDE=1 to publish a size-guide page
    ln -sfn "$(realpath ../../theme/assets)" out/assets
    (cd out && python3 -m http.server 8766)
    node shoot.js <label> [pages]     # FULL=0 for first screen only
    node overlays.js <label>          # menu, search, bag, footer
