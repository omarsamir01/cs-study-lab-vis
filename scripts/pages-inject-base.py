"""Inject <base href="/<repo>/"> into deployed index.html (GitHub Pages project sites)."""
import os
import pathlib
import sys


def main() -> None:
    repo = os.environ.get("REPO", "").strip()
    if not repo:
        raise SystemExit("REPO env var is required")

    target = pathlib.Path(sys.argv[1])
    text = target.read_text(encoding="utf-8")
    if "<base href=" in text:
        return
    # Keep charset as the first bytes of <head> for parsers; base must not precede charset.
    marker = '<meta charset="UTF-8" />'
    if marker not in text:
        raise SystemExit("Could not find charset meta in index.html")
    patched = text.replace(marker, marker + f'\n    <base href="/{repo}/" />', 1)
    target.write_text(patched, encoding="utf-8")


if __name__ == "__main__":
    main()
