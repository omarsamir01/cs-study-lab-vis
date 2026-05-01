import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { html } from "../htm.js";

/** @typedef {{
 *  caption: string,
 *  arr: number[],
 *  highlight?: Record<number,string>,
 *  radixScale?: number,
 *  radixShowDigitStrip?: boolean,
 *  shellGap?: number,
 *  shellPrevGap?: number | null,
 * }} Step */

/** @returns {number[]} */
function highlightIndices(highlights, len) {
  if (!highlights) return [];
  return Object.keys(highlights)
    .map(Number)
    .filter((i) => Number.isFinite(i) && i >= 0 && i < len)
    .sort((a, b) => a - b);
}

/** True iff sorted indices are exactly [lo, lo+1, …, hi] with no gaps. */
function isContiguousRun(sortedIdx) {
  if (sortedIdx.length < 2) return false;
  const lo = sortedIdx[0];
  const hi = sortedIdx[sortedIdx.length - 1];
  return sortedIdx.length === hi - lo + 1;
}

/** @param {string|undefined} role */
function focusPinLabel(role) {
  if (role === "pivot") return { text: "P", title: "Parent / node at this index (e.g. heap root of sift)" };
  if (role === "highlight") return { text: "C", title: "Compared slot (e.g. child or neighbor)" };
  if (role === "range") return { text: "⋯", title: "Part of the active index span / slice" };
  return { text: "•", title: "Highlighted index" };
}

/** @param {number} val @param {number} scale */
function radixDigitAt(val, scale) {
  const v = Number(val);
  if (!Number.isFinite(v) || !Number.isFinite(scale) || scale <= 0) return 0;
  return Math.floor(Math.abs(v) / scale) % 10;
}

/**
 * @param {{
 *  title: string,
 *  subtitle: string,
 *  tag: string,
 *  chips: { label: string, value: string }[],
 *  steps: Step[],
 *  inputStr: string,
 *  setInputStr: (s: string) => void,
 *  onLoad: () => void,
 * }} props
 */
export default function SortingPanel({
  title,
  subtitle,
  tag,
  chips,
  steps,
  inputStr,
  setInputStr,
  onLoad,
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(420);

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [steps]);

  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), speed);
    return () => clearTimeout(t);
  }, [playing, idx, steps.length, speed]);

  const maxVal = Math.max(1, ...(steps[idx]?.arr ?? [1]));
  const cur = steps[idx] ?? steps[0];

  /** @type {import('react').CSSProperties} */
  const inputStyle = {
    width: "100%",
    maxWidth: 420,
    resize: "vertical",
    padding: "0.5rem",
    borderRadius: "8px",
    border: "1px solid rgba(180, 190, 210, 0.22)",
    background: "rgba(0,0,0,0.12)",
    color: "#e8eaf0",
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
  };

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${cur.arr.length}, minmax(26px, 1fr))`,
  }), [cur.arr.length]);

  const barGrad = (i, marks) => {
    if (marks === "highlight")
      return "linear-gradient(180deg, var(--bar-compare-a) 0%, var(--bar-compare-b) 100%)";
    if (marks === "pivot")
      return "linear-gradient(180deg, var(--bar-pivot-a) 0%, var(--bar-pivot-b) 100%)";
    if (marks === "range") return "linear-gradient(180deg, var(--bar-range-a) 0%, var(--bar-range-b) 100%)";
    const v = cur.arr[i] ?? 0;
    const t = maxVal > 0 ? v / maxVal : 0;
    const lite = Math.round(40 + t * 11);
    const dark = Math.round(29 + t * 9);
    return `linear-gradient(180deg, hsl(218, 12%, ${lite}%), hsl(218, 10%, ${dark}%))`;
  };

  const radixScale = cur.radixScale ?? null;
  const showRadixDigits = !!(cur.radixShowDigitStrip && radixScale != null && cur.arr.length);

  const shellGap = cur.shellGap;
  const shellPrevGap = cur.shellPrevGap;
  const showShellViz = shellGap != null && shellGap > 0 && cur.arr.length > 0;

  const shellBlocks = useMemo(() => {
    if (shellGap == null || shellGap < 1 || !cur.arr.length) return [];
    /** @type {{ start: number, end: number }[]} */
    const spans = [];
    for (let start = 0; start < cur.arr.length; start += shellGap) {
      const end = Math.min(cur.arr.length - 1, start + shellGap - 1);
      spans.push({ start, end });
    }
    return spans;
  }, [shellGap, cur.arr.length]);

  /** @type {number[]} */
  const hiIx = highlightIndices(cur.highlight || {}, cur.arr.length);
  const focusLo = hiIx.length ? hiIx[0] : 0;
  const focusHi = hiIx.length ? hiIx[hiIx.length - 1] : 0;
  const focusIsRun = isContiguousRun(hiIx);
  /** During Shell sort keep only tinted bars + shell arches—hide generic bracket/P·C overlays to cut noise */
  const shellQuietChrome = !!showShellViz;
  const showRangeBracket = hiIx.length >= 2 && focusIsRun && !shellQuietChrome;
  const showFocusPins = hiIx.length > 0 && !focusIsRun && !shellQuietChrome;

  return html`
    <div className="panel">
      <h1>${title}</h1>
      <p className="subtitle">${subtitle}</p>
      <span className=${tag === "noncomparison" ? "tag noncompare" : "tag compare"}>
        ${tag === "noncomparison" ? "non-comparison" : "comparison-based"}
      </span>
      <div className="info-grid">
        ${chips.map((c) => html`<div className="info-chip"><strong>${c.label}</strong>${c.value}</div>`)}
      </div>
      <div className="sort-legend" role="presentation">
        <span className="legend-item"
          ><span className="legend-swatch compare"></span>Gold — compare</span
        >
        <span className="legend-item"><span className="legend-swatch pivot"></span>Green — key / root</span>
        <span className="legend-item"><span className="legend-swatch range"></span>Blue-purple — slice / neighbor</span>
        <span className="legend-item"><span className="legend-swatch default"></span>Gray — idle (height = value)</span>
        <span className="legend-item">
          <span className="legend-swatch focus-overlay"></span>Bracket / P·C⋯ — contiguous span vs scattered slots (hidden
          during Shell-only steps)
        </span>
      </div>
      <div className="controls">
        <textarea rows="2" style=${inputStyle} value=${inputStr} onChange=${(e) => setInputStr(e.target.value)} />
        <button className="btn btn-primary" onClick=${onLoad}>Load numbers</button>
        <button className="btn btn-accent" onClick=${() => { setIdx(0); setPlaying(true); }}>Play</button>
        <button className="btn btn-ghost" onClick=${() => setPlaying(false)}>Pause</button>
        <button className="btn btn-ghost" onClick=${() => setIdx(0)}>Reset</button>
        <button className="btn btn-ghost" onClick=${() => setIdx(Math.max(0, idx - 1))}>Step back</button>
        <button className="btn btn-ghost" onClick=${() => setIdx(Math.min(steps.length - 1, idx + 1))}>
          Step forward
        </button>
        <span className="slider-row">
          Slow
          <input type="range" min="120" max="900" value=${speed} onChange=${(e) => setSpeed(Number(e.target.value))} />
          Fast
        </span>
        <span className="slider-row">${steps.length ? idx + 1 : 0} / ${steps.length}</span>
      </div>
      <div className="sort-viz-shell">
        <${AnimatePresence} mode="wait">
          <${motion.div} key=${idx} initial=${{ opacity: 0.5, y: 4 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0.15 }}>
            ${showShellViz
              ? html`<div className="sort-shell-meta">
                  <span className="sort-shell-gap-pill">gap ${shellGap}</span>
                  ${shellPrevGap != null ? html`<span className="sort-shell-gap-was">was ${shellPrevGap}</span>` : null}
                  <span className="sort-shell-meta-hint"
                    ><code>i mod gap</code> marks which interleaved strand each index belongs to; arches group stride
                    blocks.</span
                  >
                </div>`
              : null}
            ${showShellViz && shellBlocks.length
              ? html`<div className="sort-shell-block-brackets" style=${gridStyle}>
                  ${shellBlocks.map(
                    (b, bi) =>
                      html`<div
                        className="sort-shell-block-slot"
                        key=${"shb-" + bi}
                        style=${{ gridColumn: `${b.start + 1} / ${b.end + 2}` }}
                      >
                        <div className="sort-shell-block-cap" title=${`indices ${b.start}…${b.end}`} />
                      </div>`
                  )}
                </div>`
              : null}
            ${showRadixDigits
              ? html`<div className="sort-radix-digit-row" style=${gridStyle}>
                  ${cur.arr.map((v, i) => {
                    const d = radixDigitAt(v, /** @type {number} */ (radixScale));
                    return html`<div className="sort-radix-digit-cell" key=${"rdx-" + i}>
                      <span
                        className="radix-digit-badge"
                        style=${{
                          backgroundColor: `hsla(${d * 36}, 38%, 42%, 0.82)`,
                          color: "#e8eaef",
                          boxShadow: `inset 0 0 0 1px hsla(${d * 36}, 35%, 20%, 0.35)`,
                        }}
                      >
                        ${String(d)}
                      </span>
                    </div>`;
                  })}
                </div>`
              : null}
            ${showRangeBracket
              ? html`<div className="sort-focus-bracket-hint">Gold bracket spans indices ${focusLo}–${focusHi} inclusive.</div>
                  <div className="sort-focus-bracket-row" style=${gridStyle}>
                    <div
                      className="sort-focus-bracket-slot"
                      style=${{ gridColumn: `${focusLo + 1} / ${focusHi + 2}` }}
                    >
                      <div className="sort-range-bracket-cap" title=${`indices ${focusLo}…${focusHi}`} />
                    </div>
                  </div>`
              : null}
            ${showFocusPins
              ? html`<div className="sort-focus-pins-hint">P · C · ⋯ = which highlighted column—no line links far-apart heaps.</div>
                  <div className="sort-focus-pins" style=${gridStyle}>
                    ${hiIx.map((ii) => {
                      const role = cur.highlight && cur.highlight[ii];
                      const { text, title } = focusPinLabel(role);
                      const pinClass =
                        role === "pivot"
                          ? "pin-pivot"
                          : role === "highlight"
                            ? "pin-highlight"
                            : role === "range"
                              ? "pin-range"
                              : "pin-neutral";
                      return html`<div
                        className="sort-focus-pin-cell"
                        key=${"pin-" + ii}
                        style=${{ gridColumn: `${ii + 1} / ${ii + 2}` }}
                      >
                        <span className=${"sort-focus-pin " + pinClass} title=${title}>${text}</span>
                      </div>`;
                    })}
                  </div>`
              : null}
            <div className="sort-grid" style=${gridStyle}>
              ${cur.arr.map(
                (v, i) =>
                  html`<div className="sort-cell" key=${"c-" + idx + "-" + i}>
                    <span className="bar-index-label"
                      >${i}${showShellViz
                        ? html`<sub className="shell-residue-sub" title=${`subsequence id ${i % shellGap} (i mod ${shellGap})`}>
                            ${i % shellGap}
                          </sub>`
                        : null}</span>
                    <div className="sort-bar-slot">
                      <${motion.div}
                        layout
                        className=${"bar " + ((cur.highlight && cur.highlight[i]) || "")}
                        title=${`index ${i}, value ${v}`}
                        style=${{
                          height: `${(v / maxVal) * 100 + 20}px`,
                          background: barGrad(i, cur.highlight && cur.highlight[i]),
                        }}
                        initial=${{ scaleY: 0.92 }}
                        animate=${{ scaleY: 1 }}
                        transition=${{ type: "spring", stiffness: 380, damping: 30 }}
                      >
                        ${v}
                      </${motion.div}>
                    </div>
                  </div>`
              )}
            </div>
          </${motion.div}>
        </${AnimatePresence}>
      </div>
      <p className="step-caption">${cur.caption}</p>
      <p className="callout-soft">
        Tip: single-step mode lines up narration, tinted bars, and the index row. Default list follows
        <code> Lab_8_task.cpp </code>.
      </p>
    </div>
  `;
}
