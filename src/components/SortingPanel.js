import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { html } from "../htm.js";
import MergeSortDiagram from "./MergeSortDiagram.js";
import CountingSortDiagram from "./CountingSortDiagram.js";
import RadixBucketDiagram from "./RadixBucketDiagram.js";
import ShellSortDiagram from "./ShellSortDiagram.js";
import HeapSortDiagram from "./HeapSortDiagram.js";
import InsertionSortTrace from "./InsertionSortTrace.js";

/** Min / max milliseconds between autoplay steps (lower = faster). */
const SORT_DELAY_MS_FAST = 120;
const SORT_DELAY_MS_SLOW = 900;

/** @typedef {{
 *  caption: string,
 *  arr: number[],
 *  highlight?: Record<number,string>,
 *  radixScale?: number,
 *  radixShowDigitStrip?: boolean,
 *  shellGap?: number,
 *  shellPrevGap?: number | null,
 *  mergeDiagramPhases?: Array<{ phase: string, chunks: number[][], caption: string }>,
 *  mergeRevealExclusive?: number,
 *  countingViz?: Record<string, unknown>,
 *  radixViz?: Record<string, unknown>,
 *  heapViz?: { heapSize: number, done?: boolean },
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

/** Highlight suffix for compact array cells */
function flatCellHighlightClass(role) {
  if (role === "pivot") return " sort-flat-cell--pivot";
  if (role === "highlight") return " sort-flat-cell--highlight";
  if (role === "range") return " sort-flat-cell--range";
  return "";
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
 *  vizMode?: string,
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
  vizMode,
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(420);
  const speedSliderShown = SORT_DELAY_MS_FAST + SORT_DELAY_MS_SLOW - speed;
  const speedFillPct =
    ((speedSliderShown - SORT_DELAY_MS_FAST) / (SORT_DELAY_MS_SLOW - SORT_DELAY_MS_FAST)) * 100;

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

  const cur = steps[idx] ?? steps[0];

  /** @type {import('react').CSSProperties} */
  const inputStyle = {
    width: "100%",
    maxWidth: 420,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "var(--font-mono)",
    fontSize: "0.85rem",
  };

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${Math.max(cur.arr.length, 1)}, minmax(28px, 1fr))`,
  }), [cur.arr.length]);

  const radixScale = cur.radixScale ?? null;
  const radixViz = /** @type {{ keys?: number[] } | undefined} */ (cur.radixViz);
  const radixBucketsOn = !!(radixViz && Array.isArray(radixViz.keys));

  const showRadixDigits =
    !!(cur.radixShowDigitStrip && radixScale != null && cur.arr.length) && !radixBucketsOn;

  const shellGap = cur.shellGap;
  const shellPrevGap = cur.shellPrevGap;
  const showShellViz = shellGap != null && shellGap > 0 && cur.arr.length > 0;
  const shellInfographicOn = showShellViz;

  const heapVizRaw = /** @type {typeof cur.heapViz | undefined} */ (cur.heapViz);
  const heapDiagramOn =
    heapVizRaw != null &&
    typeof heapVizRaw.heapSize === "number" &&
    Number.isFinite(/** @type {number} */ (heapVizRaw.heapSize));
  const heapViz = heapDiagramOn ? heapVizRaw : null;

  /** @type {number[]} */
  const hiIx = highlightIndices(cur.highlight || {}, cur.arr.length);
  const focusLo = hiIx.length ? hiIx[0] : 0;
  const focusHi = hiIx.length ? hiIx[hiIx.length - 1] : 0;
  const focusIsRun = isContiguousRun(hiIx);

  const showInsertionTrace = vizMode === "insertion";

  /** During Shell / heap infographic / insertion trace hide generic bracket / P·C overlays */
  const vizQuietChrome = !!(showShellViz || heapDiagramOn || showInsertionTrace);
  const showRangeBracket = hiIx.length >= 2 && focusIsRun && !vizQuietChrome;
  const showFocusPins = hiIx.length > 0 && !focusIsRun && !vizQuietChrome;

  /** Merge sort attaches this on every step — read from current frame */
  const mergePhases =
    steps[idx]?.mergeDiagramPhases ?? steps[0]?.mergeDiagramPhases;
  const revealRaw = cur.mergeRevealExclusive;
  const mergeRevealExclusive =
    mergePhases && typeof revealRaw === "number" && Number.isFinite(revealRaw)
      ? Math.min(Math.max(0, revealRaw), mergePhases.length)
      : mergePhases?.length ?? 0;
  const mergeFlowchartViz =
    !!(mergePhases && mergePhases.length > 0 && cur.arr.length > 0);

  const countingViz = /** @type {typeof cur.countingViz} */ (cur.countingViz);
  const countingVizOn =
    !!(countingViz && countingViz.inputKeys && countingViz.inputKeys.length > 0);

  /** Flat array row (no bar heights). Hidden when a diagram already shows the full array. */
  const showFlatArrayStrip =
    !mergeFlowchartViz &&
    !countingVizOn &&
    !radixBucketsOn &&
    !heapDiagramOn &&
    !shellInfographicOn &&
    !showInsertionTrace &&
    cur.arr.length > 0;

  return html`
    <div
      className=${"panel" +
      (mergeFlowchartViz ? " panel-merge-sort" : "") +
      (countingVizOn ? " panel-count-sort" : "") +
      (radixBucketsOn ? " panel-radix-buckets" : "") +
      (shellInfographicOn ? " panel-shell-sort-ig" : "") +
      (heapDiagramOn ? " panel-heap-sort-viz" : "") +
      (showInsertionTrace ? " panel-insertion-trace" : "")}
    >
      <h1>${title}</h1>
      <p className="subtitle">${subtitle}</p>
      <span className=${tag === "noncomparison" ? "tag noncompare" : "tag compare"}>
        ${tag === "noncomparison" ? "non-comparison" : "comparison-based"}
      </span>
      <div className="info-grid sorting-complexity-grid">
        ${chips.map((c) => html`<div className="info-chip"><strong>${c.label}</strong>${c.value}</div>`)}
      </div>
      ${mergeFlowchartViz
        ? html`<p className="merge-diagram-explainer">
            Flowchart advances with each step. Divide rows match your input; conquer rows show the sorted runs that each
            tier represents (values stay fixed per row so they do not jump when a deeper merge rewrites the live array).
            The caption narrates what <code>merge()</code> is doing on the indices.
          </p>`
        : null}
      ${countingVizOn
        ? html`<p className="count-sort-explainer">
            Three rows align with Lab logic: keys, cumulative <code>count[]</code> (length ${String(Number(countingViz.maxKey) + 1)}), then the stable output scratch. Highlights mark the active index in
            <strong>Array</strong>, bucket <strong>count[key]</strong>, and placement in <strong>Output</strong>.
          </p>`
        : null}
      ${radixBucketsOn
        ? html`<p className="radix-bucket-explainer">
            Ten <strong>queues</strong> (0–9) follow the textbook bucket view. Numbers use the padded width of the largest
            value; the active digit column is underlined. Stacks are bottom-first (stable left→right enqueue).
          </p>`
        : null}
      ${heapDiagramOn && heapViz
        ? html`<p className="heap-sort-explainer">
            The pyramid is the <strong>logical max-heap</strong> backed by indices <code>[0 .. heapSize - 1]</code> of the row
            below. Tinted cells match sift / extract highlights; sorted positions live in the tail.
          </p>`
        : null}
      ${shellInfographicOn
        ? html`<p className="shell-ig-explainer">
            The gap diagram shows each strand: each slot is tinted by its residue (<code>i mod gap</code>). Each row
            lists every index in one subsequence spaced by gap. When highlighted indices lie on the same strand, that row is
            emphasized.
          </p>`
        : null}
      ${showInsertionTrace
        ? html`<p className="insertion-sort-explainer">
            Each numbered row stacks every snapshot through the current step (like textbook execution figures).
            <strong>Key</strong> is the value being inserted; <strong>shift lane</strong> marks the neighbor it compares.
            Below the cells, a <strong>dot</strong> marks the key column and an <strong>upward</strong> chevron marks the compare
            column—the curve and both markers share the same <code>(i + ½) / n</code> fractions so they stay glued to the arc.
          </p>`
        : null}
      ${mergeFlowchartViz || countingVizOn || radixBucketsOn || shellInfographicOn || heapDiagramOn || showInsertionTrace
        ? null
        : html`<div className="sort-legend" role="presentation">
            <span className="legend-item"
              ><span className="legend-swatch compare"></span>Gold — compare</span
            >
            <span className="legend-item"><span className="legend-swatch pivot"></span>Green — key / root</span>
            <span className="legend-item"><span className="legend-swatch range"></span>Blue-purple — slice / neighbor</span>
            <span className="legend-item"><span className="legend-swatch default"></span>Gray — neutral slot</span>
            <span className="legend-item">
              <span className="legend-swatch focus-overlay"></span>Bracket / P·C⋯ — contiguous span vs scattered slots
              (hidden during Shell / heap diagram steps)
            </span>
          </div>`}
      <div className="controls">
        <textarea
          rows="2"
          style=${inputStyle}
          placeholder="value"
          value=${inputStr}
          onChange=${(e) => setInputStr(e.target.value)}
        />
        <button className="btn btn-primary" onClick=${onLoad}>Load numbers</button>
        <button className="btn btn-accent" onClick=${() => { setIdx(0); setPlaying(true); }}>Play</button>
        <button className="btn btn-ghost" onClick=${() => setPlaying(false)}>Pause</button>
        <button className="btn btn-ghost" onClick=${() => { setPlaying(false); setIdx(0); }}>Reset</button>
        <button className="btn btn-ghost" onClick=${() => { setPlaying(false); setIdx(Math.max(0, idx - 1)); }}>
          Step back
        </button>
        <button
          className="btn btn-ghost"
          onClick=${() => { setPlaying(false); setIdx(Math.min(steps.length - 1, idx + 1)); }}
          >Step forward
        </button>
        <div className="sort-speed-row">
          <span className="sort-speed-label">Slow</span>
          <div className="sort-speed-track-wrap">
            <input
              className="sort-speed-range"
              type="range"
              min=${SORT_DELAY_MS_FAST}
              max=${SORT_DELAY_MS_SLOW}
              value=${speedSliderShown}
              aria-label="Playback speed: slower on the left, faster on the right"
              title="Delay between steps (ms): left = slower, right = faster"
              style=${{ "--speed-fill-pct": `${speedFillPct}%` }}
              onChange=${(e) =>
                setSpeed(SORT_DELAY_MS_FAST + SORT_DELAY_MS_SLOW - Number(e.target.value))}
            />
          </div>
          <span className="sort-speed-label">Fast</span>
          <span className="sort-speed-step" aria-live="polite"
            >Step ${steps.length ? idx + 1 : 0} / ${steps.length}</span
          >
        </div>
      </div>
      <div
        className=${"sort-viz-shell " +
        (mergeFlowchartViz ? "sort-viz-merge-flow " : "") +
        (countingVizOn ? "sort-viz-count-sort " : "") +
        (radixBucketsOn ? "sort-viz-radix-buckets " : "") +
        (shellInfographicOn ? "sort-viz-shell-ig " : "") +
        (heapDiagramOn ? "sort-viz-heap-tree " : "") +
        (showInsertionTrace ? "sort-viz-insertion-trace " : "")}
      >
        ${mergeFlowchartViz
          ? html`<${MergeSortDiagram}
              key=${"merge-chart-" + idx}
              phases=${mergePhases}
              revealExclusive=${mergeRevealExclusive}
            />`
          : countingVizOn
            ? html`<${CountingSortDiagram} key=${"count-viz-" + idx} viz=${countingViz} />`
            : radixBucketsOn
              ? html`<${RadixBucketDiagram} key=${"radix-" + idx} viz=${radixViz} />`
              : showInsertionTrace
                ? html`<${InsertionSortTrace} steps=${steps} uptoIndex=${idx} />`
              : html`<${AnimatePresence} mode="wait">
              <${motion.div} key=${idx} initial=${{ opacity: 0.5, y: 4 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0.15 }}>
                ${html`
                  ${heapDiagramOn && heapViz
                    ? html`<${HeapSortDiagram}
                        key=${"heap-ig-" + idx}
                        arr=${cur.arr}
                        heapViz=${heapViz}
                        highlight=${cur.highlight}
                      />`
                    : null}
                  ${shellInfographicOn && shellGap != null
                    ? html`<${ShellSortDiagram}
                        key=${"shell-ig-" + idx}
                        arr=${cur.arr}
                        gap=${shellGap}
                        highlight=${cur.highlight}
                        prevGap=${shellPrevGap}
                      />`
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
                  ${showFlatArrayStrip
                    ? html`<div className="sort-flat-array-strip" style=${gridStyle}>
                        ${cur.arr.map(
                          (v, i) =>
                            html`<div
                              key=${"fl-" + idx + "-" + i}
                              className=${"sort-flat-cell mono" + flatCellHighlightClass(cur.highlight && cur.highlight[i])}
                              title=${`index ${i}, value ${v}`}
                            >
                              <span className="sort-flat-ix">${String(i)}</span>
                              <span className="sort-flat-val">${String(v)}</span>
                            </div>`
                        )}
                      </div>`
                    : null}
                `}
              </${motion.div}>
            </${AnimatePresence}>`
          }
      </div>
      <p className="step-caption">${cur.caption}</p>
      ${mergeFlowchartViz || countingVizOn || radixBucketsOn || shellInfographicOn || heapDiagramOn || showInsertionTrace
        ? null
        : html`<p className="callout-soft">
        Tip: single-step mode lines up narration with the row of index boxes and captions. Default values match the usual demo arrays for each algorithm.
      </p>`}
    </div>
  `;
}
