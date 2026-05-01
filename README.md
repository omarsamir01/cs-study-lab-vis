# CS Study Lab (sorting + data structures UI)

## Run locally

Do **not** open `index.html` directly (`file://`). ES modules need HTTP.

1. Double-click `start-server.bat`, **or**
2. `node serve.mjs`, **or**
3. `python -m http.server 8090`

Then open **http://127.0.0.1:8090/**

## Live demo (GitHub Pages)

After the workflow **Deploy to GitHub Pages** finishes successfully:  
**https://omarsamir01.github.io/cs-study-lab-vis/**

The site uses **jsDelivr `+esm` bundles** so module sub-requests stay on one CDN (more reliable on GitHub Pages than mixed `esm.sh` loads). A **`404.html`** copy of `index.html` is published so deep links fall back without a hard 404.

If the first deployment fails: go to **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**, save, then open the **Actions** tab and **Re-run** the failed job.

If **Actions succeeds** but the site still looks like an older revision: GitHub Pages is usually already updated—the browser cached modules and CSS instead. Hard-refresh (**Ctrl+Shift+R** / clear cache). Each deploy stamps `theme.css`, `main.js`, and relative ES module URLs with `?v=<sha>` so a normal reload picks up changes after CI finishes.

## Why it broke before

Separate `esm.sh` URLs each bundled their own React → **Invalid hook call** → blank page. This project uses an **import map** so `react`, `react-dom`, Router, and Framer Motion share one React instance.
