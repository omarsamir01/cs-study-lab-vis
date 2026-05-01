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

If the first deployment fails: go to **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**, save, then open the **Actions** tab and **Re-run** the failed job.

## Why it broke before

Separate `esm.sh` URLs each bundled their own React → **Invalid hook call** → blank page. This project uses an **import map** so `react`, `react-dom`, Router, and Framer Motion share one React instance.
