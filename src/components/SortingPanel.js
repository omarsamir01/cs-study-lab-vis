import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { html } from "../htm.js";

/** @typedef {{ caption: string, arr: number[], highlight?: Record<number,string> }} Step */

/** @param {Record<number,string>|undefined} highlights @param {number} len */
function focusSummary(highlights, len) {
  if (!highlights || !Object.keys(highlights).length) {
    return {
      line:
        "This step doesn’t tint specific slots—follow the caption: the heights still match array values.",
      indices: [],
    };
  }
  const pairs = /** @type {[number,string][]} */ (Object.entries(highlights)).map(([i, k]) => [
    Number(i),
    k,
  ]);
  pairs.sort((a, b) => a[0] - b[0]);
  const idxs = pairs.map((p) => p[0]).filter((i) => i >= 0 && i < len);
  const byRole = pairs.reduce((acc, [i, k]) => {
    if (i < 0 || i >= len) return acc;
    if (!acc[k]) acc[k] = [];
    acc[k].push(i);
    return acc;
  }, /** @type {Record<string, number[]>} */ ({}));

  const roleBits = [];
  if (byRole.highlight) roleBits.push(`gold → compare/move [${byRole.highlight.join(", ")}]`);
  if (byRole.pivot) roleBits.push(`green → pivot/key [${byRole.pivot.join(", ")}]`);
  if (byRole.range) roleBits.push(`blue → slice [${byRole.range.join(", ")}]`);

  return {
    line: roleBits.join(" • ") || "Highlighted slots flagged in the tint legend.",
    indices: idxs,
  };
}

const flowSvg = html`<svg className="sort-flow-svg" viewBox="0 0 140 14" aria-hidden="true">
  <line x1="2" y1="7" x2="118" y2="7" stroke="currentColor" stroke-width="1.4" />
  <polyline points="110,3 118,7 110,11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

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

  const summary = useMemo(() => focusSummary(cur.highlight, cur.arr.length), [cur.highlight, cur.arr.length]);

  const barGrad = (i, marks) => {
    if (marks === "highlight")
      return "linear-gradient(180deg, var(--bar-compare-a) 0%, var(--bar-compare-b) 100%)";
    if (marks === "pivot")
      return "linear-gradient(180deg, var(--bar-pivot-a) 0%, var(--bar-pivot-b) 100%)";
    if (marks === "range") return "linear-gradient(180deg, var(--bar-range-a) 0%, var(--bar-range-b) 100%)";
    const v = cur.arr[i] ?? 0;
    const hue = 215 + ((v % 13) / 13) * 35;
    return `linear-gradient(180deg, hsl(${hue}, 38%, ${52 + ((v % 7) % 3)}%) 0%, hsl(${hue}, 32%, 36%) 100%)`;
  };

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${cur.arr.length}, minmax(26px, 1fr))`,
  }), [cur.arr.length]);

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
          ><span className="legend-swatch compare"></span>Gold — compare / shift lane</span
        >
        <span className="legend-item"><span className="legend-swatch pivot"></span>Green — key / root / insert hole</span>
        <span className="legend-item"><span className="legend-swatch range"></span>Blue — subarray / merge window</span>
        <span className="legend-item"><span className="legend-swatch default"></span>Cool bars — idle this beat</span>
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
          <motion.div key=${idx} initial=${{ opacity: 0.5, y: 4 }} animate=${{ opacity: 1, y: 0 }} exit=${{ opacity: 0.15 }}>
            <div className="sort-grid" style=${gridStyle}>
              ${cur.arr.map(
                (v, i) =>
                  html`<div className="sort-cell" key=${"c-" + idx + "-" + i}>
                    <span className="bar-index-label">${i}</span>
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
                  </div>`
              )}
            </div>
          </motion.div>
        </${AnimatePresence}>
        <div className="sort-flow-strip">
          ${flowSvg}
          <span>
            ${summary.indices.length >= 2
              ? html`Scan window: <span className="sort-flow-strong">${Math.min(...summary.indices)} ⟶ ${Math.max(...summary.indices)}</span>`
              : html`Track <span className="sort-flow-strong">index labels</span> above each bar`}
            — ${summary.line}
          </span>
        </div>
      </div>
      <p className="step-caption">${cur.caption}</p>
      <p className="callout-soft">
        Tip: single-step mode lines up narration, tinted bars, and the index row. Default list follows
        <code> Lab_8_task.cpp </code>.
      </p>
    </div>
  `;
}
