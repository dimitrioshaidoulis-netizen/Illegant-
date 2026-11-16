# Tests

`qa/` runs against the local preview (`tools/preview`, port 8766). From `tools/preview`:

    npm i                                   # liquidjs, theme-check, axe-core
    ln -sfn /path/to/playwright node_modules/playwright   # or npm i playwright
    node render.js ../../theme out          # renders every page type (add a locale as the 4th argument, e.g. el)
    python3 gen-images.py out/img out/image-names.json    # stand-in photographs, once
    ln -sfn "$(realpath ../../theme/assets)" out/assets && cp -r stub out/stub
    (cd out && python3 -m http.server 8766 --bind 127.0.0.1 &)

Then from `tests/qa`:

    node dialogs.test.js        # 96 checks: Search / Bag open and close, page offset, focus (exit code 1 on failure)
    node password.test.js       # 32 checks: password page, English and Greek (render Greek to out/password-el.html)
    node trace-home-entry.js [scriptDelayMs] [imageDelayMs]   # per-frame position of the ring photographs
    node profile-close.js phone # per-frame open/close profile of each panel
    node a11y.js                # axe-core over every page type
    node sheet.js phone shots/phone && python3 sheet.py shots/phone 5 0.75   # contact sheets

The files directly in `tests/` are the 3 November harness (synthetic page, port 8765); `qa/` supersedes it.
