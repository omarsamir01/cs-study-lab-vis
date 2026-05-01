"""Append a cache-bust query to relative .js / .mjs import specifiers in copied sources.

Browsers aggressively cache ES module graphs on GitHub Pages; stamping each deploy's
imports forces every module URL to change with the commit.
"""
from __future__ import annotations

import pathlib
import re
import sys


FROM_IMPORT = re.compile(r'(?P<pre>\b(?:from|import)\s+)(?P<q>["\'])(?P<path>\.?\.?/[^"\']+\.(?:js|mjs))(?P=q)')


def stamp_text(text: str, token: str) -> str:
    def repl(m: re.Match[str]) -> str:
        whole = m.group(0)
        if "?v=" in whole:
            return whole
        path = m.group("path")
        q = m.group("q")
        pre = m.group("pre")
        return f'{pre}{q}{path}?v={token}{q}'

    return FROM_IMPORT.sub(repl, text)


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit("usage: pages-stamp-js-imports.py <deploy/src> <GITHUB_SHA>")
    root = pathlib.Path(sys.argv[1]).resolve()
    token = sys.argv[2].strip()
    if not token:
        raise SystemExit("GITHUB_SHA token required")

    if len(token) > 40 and all(c in "0123456789abcdefABCDEF" for c in token):
        token = token[:7]

    for path in root.rglob("*"):
        if path.suffix not in (".js", ".mjs") or ".git" in path.parts:
            continue
        raw = path.read_text(encoding="utf-8")
        out = stamp_text(raw, token)
        if out != raw:
            path.write_text(out, encoding="utf-8")


if __name__ == "__main__":
    main()
