# Dialog regression harness

Local Chromium checks for `theme/assets/s-dialog.js` with the theme's compiled CSS (no Shopify needed).

    cp ../theme/assets/styles.min.css ../theme/assets/s-dialog.js .   # page.html also inlines the QA CSS from snippets/theme-styles.liquid
    python3 -m http.server 8765 --bind 127.0.0.1 &
    node test-dialog.js   # scroll restore (plain, shifted-while-open, native close, Escape) + close motion profile
    node edge.js          # reopen during exit, double close, focus return
    node fs.js            # phone form-field font size

Expected: every scrollY equals the value before opening (1500 / 900); no page errors.
