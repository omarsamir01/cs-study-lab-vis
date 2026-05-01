import React, { useMemo } from "react";
import { html } from "../htm.js";
import { computeMergeDiagramPhases } from "../lib/mergeSortDiagram.js";

/**
 * @typedef {{ phase: string, chunks: number[][], caption: string }} DiagramPhase
 *
 * Conquer rows use static `phase.chunks` from the merge tree (textbook layout).
 * We do not splice `arr` into those rows: one shared array updates in place during merges,
 * so left-to-right slices would mutate earlier rows and drop cells mid-step.
 */

/**
 * @param {{
 *   phases?: DiagramPhase[],
 *   vals?: number[],
 *   revealExclusive: number,
 * }} props
 */
export default function MergeSortDiagram({ phases: phasesProp, vals, revealExclusive }) {
  const phases = useMemo(() => {
    if (phasesProp && phasesProp.length) return phasesProp;
    return computeMergeDiagramPhases(vals ?? []).phases;
  }, [phasesProp, vals]);

  const rows = useMemo(() => {
    const end = Math.max(0, Math.min(revealExclusive, phases.length));
    return phases.slice(0, end);
  }, [phases, revealExclusive]);

  const fullDivide =
    phases.filter((p) => p.phase === "unsorted" || p.phase === "divide").length;
  const fullConquer = Math.max(phases.length - fullDivide, 1);

  if (!phases.length) {
    return html`<div className="merge-flowchart-shell merge-flowchart-empty">No values to visualize.</div>`;
  }

  return html`<div className="merge-flowchart-shell">
    <div className="merge-flowchart-grid">
      <div className="merge-flowchart-main">
        ${rows.map(
          (phase, ri) =>
            html`<div className="merge-diagram-phase" key=${"ms-" + ri}>
              ${ri > 0
                ? html`<div className="merge-flow-arrow" aria-hidden="true">
                    <svg width="40" height="14" viewBox="0 0 40 14" className="merge-arrow-svg">
                      <path
                        d="M20 2v7M13 11l7 3 7-3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.65"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>`
                : null}
              ${phase.caption
                ? html`<div className=${"merge-phase-caption merge-cap-" + phase.phase}>${phase.caption}</div>`
                : null}
              <div className=${"merge-stage-row merge-phase-" + phase.phase}>
                ${phase.chunks.map(
                  (chunk, ci) =>
                    html`<div className="merge-chunk" key=${"ch-" + ri + "-" + ci}>
                      ${chunk.map((v, vi) => html`<span className="merge-cell" key=${"v-" + vi}>${v}</span>`)}
                    </div>`
                )}
              </div>
            </div>`
        )}
      </div>
      <div className="merge-flowchart-sidebar">
        <div className="merge-side-zone divide-zone" style=${{ flex: Math.max(fullDivide, 1), minHeight: 20 }}>
          <span className="merge-side-label">Divide</span>
          <span className="merge-side-dots"></span>
        </div>
        <div className="merge-side-zone conquer-zone" style=${{ flex: fullConquer, minHeight: 20 }}>
          <span className="merge-side-dots conquer-dots"></span>
          <span className="merge-side-label merge-side-label-span">Conquer &amp; merge</span>
        </div>
      </div>
    </div>
  </div>`;
}
