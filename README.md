# CS Study Lab (sorting + data structures UI)

## Run locally

Do **not** open `index.html` directly (`file://`). ES modules need HTTP.

1. Double-click `start-server.bat`, **or**
2. `node serve.mjs`, **or**
3. `python -m http.server 8090`

Then open **http://127.0.0.1:8090/**

## Why it broke before

Separate `esm.sh` URLs each bundled their own React → **Invalid hook call** → blank page. This project uses an **import map** so `react`, `react-dom`, Router, and Framer Motion share one React instance.
