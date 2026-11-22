# Tests

`qa/` runs against the local preview (`tools/preview`, port 8766). From `tools/preview`:

    npm i                                   # liquidjs, theme-check, axe-core
    ln -sfn /path/to/playwright node_modules/playwright   # or npm i playwright
    node render.js ../../theme out          # renders every page type (add a locale as the 4th argument, e.g. el)
    # extra states: CART=1 (bag with lines), EMPTY_STORE=1, DESIGN_MODE=1; render to another folder and copy pages as
    # <page>-cart.html, <page>-empty.html, <page>-design.html (commerce.test.js expects collection-cart, cart-cart, index-empty, index-design)
    python3 gen-images.py out/img out/image-names.json    # stand-in photographs, once
    ln -sfn "$(realpath ../../theme/assets)" out/assets && cp -r stub out/stub
    (cd out && python3 -m http.server 8766 --bind 127.0.0.1 &)

Then from `tests/qa`:

    node commerce.test.js       # 42 checks: variants, sold-out + Notify me, Add to bag / quick add (mocked Standard Actions), prices, bag, empty store
    node home-layout.test.js    # 230 checks: homepage order and one-screen fit on 13 phone sizes + 2 desktops (pass a page file, e.g. index-el, for Greek)
    node home-scroll.test.js    # 44 checks: homepage scrolling with real touch events on 3 phones and a tablet
    node home-wheel.desktop.js  # desktop probe: wheel, keyboard and scrollbar resting positions (compare with diff)
    node dialogs.test.js        # 96 checks: Search / Bag open and close, page offset, focus (exit code 1 on failure)
    node password.test.js       # 32 checks: password page, English and Greek (render Greek to out/password-el.html)
    node trace-home-entry.js [scriptDelayMs] [imageDelayMs]   # per-frame position of the ring photographs
    node profile-close.js phone # per-frame open/close profile of each panel
    node a11y.js                # axe-core over every page type
    node sheet.js phone shots/phone && python3 sheet.py shots/phone 5 0.75   # contact sheets

The files directly in `tests/` are the 3 November harness (synthetic page, port 8765); `qa/` supersedes it.
