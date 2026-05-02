import React, { useLayoutEffect, useRef } from "react";
import { html } from "../htm.js";

/** @param {any} s */
function vizFromStep(s) {
  const v = s.insertionViz;
  if (v && Array.isArray(v.values)) return v;
  return {
    values: [...(s.arr || [])],
    keyIndex: null,
    shiftIndices: [],
    arrow: /** @type {null} */ (null),
  };
}

/** @param {number} ix @param {ReturnType<typeof vizFromStep>} viz */
function cellClass(ix, viz) {
  if (viz.keyIndex === ix) return " insertion-trace-cell--key";
  /** @type {number[]} */
  const reds = viz.shiftIndices || [];
  if (reds.includes(ix)) return " insertion-trace-cell--shift";
  return " insertion-trace-cell--neutral";
}

/**
 * %-like X in SVG viewBox 0–100 (uniform column centers; overlays use the same fractions).
 * @param {number} i @param {number} n */
function svgXCenter(i, n) {
  return (((i + 0.5) / n) * 100).toFixed(4);
}

/**
 * Matches {@link svgXCenter} horizontally: `(i + ½) / n × 100%`.
 * Keeps green dot / red head on the Bézier anchors (same fractions as the path; traces match the arc).
 * @param {number} i @param {number} n */
function connectorLeftPct(i, n) {
  return `${((i + 0.5) / n) * 100}%`;
}

/**
 * Curved hole→compare connector: Bézier + dot + upward-pointing chevron toward the compare cell.
 *
 * @param {{ from: number, to: number }} arrow @param {number} n */
function insertionCellConnector(arrow, n) {
  if (!arrow || typeof arrow.from !== "number" || typeof arrow.to !== "number") return null;
  if (arrow.from === arrow.to || n <= 0) return null;

  const fp = connectorLeftPct(arrow.from, n);
  const tp = connectorLeftPct(arrow.to, n);
  const xf = Number(svgXCenter(arrow.from, n));
  const xt = Number(svgXCenter(arrow.to, n));

  const upHalf = 9;
  const upH = 8;
  /** Match `tipStyle.top` / `borderBottom`; stroke ends near chevron base (viewBox y = px here). */
  const triTopPx = 1;
  const yKey = 18;
  const yDip = 31;
  const yCmpStroke = triTopPx + upH;

  const pathD = `M ${xf.toFixed(4)} ${yKey} C ${xf.toFixed(4)} ${yDip} ${xt.toFixed(4)} ${yDip} ${xt.toFixed(4)} ${yCmpStroke}`;

  /** @type {Record<string,string|number>} */
  const shellStyle = {
    position: "relative",
    width: "100%",
    height: 36,
    marginTop: 4,
  };

  /** @type {Record<string,string|number>} */
  const svgWrapStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 36,
    overflow: "visible",
    pointerEvents: "none",
  };

  /** @type {Record<string,string|number>} */
  const dotStyle = {
    position: "absolute",
    left: fp,
    top: "50%",
    width: 9,
    height: 9,
    margin: 0,
    padding: 0,
    borderRadius: "50%",
    boxSizing: "border-box",
    background: "rgba(95, 180, 118, 0.65)",
    border: "2px solid rgba(140, 210, 160, 0.55)",
    transform: "translate(-50%, -50%)",
    zIndex: 2,
  };

  /** Apex points up toward the compare cell (`borderBottom` wedge below the apex). */
  /** @type {Record<string,string|number>} */
  const tipStyle = {
    position: "absolute",
    left: tp,
    top: triTopPx,
    width: 0,
    height: 0,
    zIndex: 2,
    borderLeft: `${upHalf}px solid transparent`,
    borderRight: `${upHalf}px solid transparent`,
    borderBottom: `${upH}px solid rgba(210, 120, 140, 0.95)`,
    transform: "translateX(-50%)",
  };

  return html`<div className="insertion-trace-arrow-row insertion-trace-cell-connector" style=${shellStyle}>
    <svg
      width="100%"
      height="36"
      viewBox="0 0 100 36"
      preserveAspectRatio="none"
      aria-hidden="true"
      style=${svgWrapStyle}
    >
      <path
        d=${pathD}
        fill="none"
        stroke="rgba(172, 186, 216, 0.85)"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
    <div style=${dotStyle}></div>
    <div style=${tipStyle}></div>
  </div>`;
}

/**
 * @param {{ steps: unknown[], uptoIndex: number }} props
 */
export default function InsertionSortTrace({ steps, uptoIndex }) {
  const scrollRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [uptoIndex, steps]);

  if (!steps.length) {
    return html`<div className="insertion-sort-trace"><p className="step-caption">No steps yet.</p></div>`;
  }
  const cap = Math.max(0, Math.min(Number(uptoIndex) || 0, steps.length - 1));
  const rows = steps.slice(0, cap + 1);

  return html`<div className="insertion-sort-trace" aria-label="Insertion sort execution trace">
        <div className="insertion-sort-trace-head">
          <h3 className="insertion-sort-trace-title">Insertion sort execution</h3>
          <div className="insertion-sort-trace-legend" role="presentation">
            <span className="trace-legend-item">
              <span className="trace-swatch insertion-legend-swatch--key"></span>Key
            </span>
            <span className="trace-legend-item">
              <span className="trace-swatch insertion-legend-swatch--shift"></span>Shift lane
            </span>
            <span className="trace-legend-item">
              <span className="trace-swatch insertion-legend-swatch--neutral"></span>Rest
            </span>
          </div>
        </div>
        <div className="insertion-sort-trace-scroll" ref=${scrollRef}>${rows.map((stepRow, ri) =>
          traceHistoryRow(stepRow, ri, rows.length)
        )}</div>
      </div>`;
}

/** @param {any} stepRow */
function traceHistoryRow(stepRow, ri, rowCount) {
  const viz = vizFromStep(stepRow);
  const n = viz.values.length;
  const isLatest = ri === rowCount - 1;

  if (n === 0) {
    return html`<div
      key=${`ins-empty-${ri}`}
      className=${"insertion-trace-history-row" + (isLatest ? " insertion-trace-history-row--current" : "")}
    >
      <span className="insertion-trace-row-ix mono">${ri + 1}</span>
      <div className="insertion-trace-row-body"><p className="insertion-trace-empty">∅</p></div>
    </div>`;
  }

  const connector = insertionCellConnector(viz.arrow, n);

  return html`<div
    key=${`ins-row-${ri}`}
    className=${"insertion-trace-history-row" + (isLatest ? " insertion-trace-history-row--current" : "")}
  >
    <span className="insertion-trace-row-ix mono">${ri + 1}</span>
    <div className="insertion-trace-row-body">
      <div
        className="insertion-trace-cell-grid"
        role="presentation"
        style=${{ gridTemplateColumns: `repeat(${n}, minmax(2.1rem, 1fr))` }}
      >
        ${viz.values.map(
          (val, ix) =>
            html`<span className=${"insertion-trace-cell mono" + cellClass(ix, viz)} key=${`${ri}-${ix}`}
              >${String(val)}</span
            >`
        )}
      </div>
      ${connector}
    </div>
  </div>`;
}
