import React from "react";
import { html } from "../htm.js";

/**
 * Radix LSD infographic: numbered list → 10 queues (0–9) → optional flattened order.
 *
 * @param {{
 *   viz: {
 *     phase: string,
 *     keys: number[],
 *     underlineScale?: number | null,
 *     buckets: number[][],
 *     listAfter?: number[] | null,
 *     placeLabel: string,
 *     scale: number,
 *     maxKeyDigits: number,
 *   },
 * }} props
 */
export default function RadixBucketDiagram({ viz }) {
  if (!viz || !viz.keys) return null;

  const keys = viz.keys;
  const underlineScale =
    viz.underlineScale != null && viz.underlineScale > 0 ? viz.underlineScale : null;

  /** index in padded string char array for digit at this radix scale */
  const underlineDigitCharIndex = (scale, paddedLen) => {
    let place = 0;
    for (let s = 1; s < scale && scale < 1e15; s *= 10) place++;
    const idxFromLeft = paddedLen - 1 - place;
    return Math.max(0, Math.min(idxFromLeft, paddedLen - 1));
  };

  const renderNumberWithUnderline = (val) => {
    const padded = String(val).padStart(viz.maxKeyDigits, "0");
    const uIx = underlineScale != null ? underlineDigitCharIndex(underlineScale, padded.length) : -1;
    return padded.split("").map((ch, ci) =>
      html`<span
        key=${"d-" + val + "-" + ci}
        className=${ci === uIx ? "radix-num-digit radix-num-digit-ul" : "radix-num-digit"}
        >${ch}</span
      >`
    );
  };

  const la = viz.listAfter;
  const afterRow =
    la && la.length
      ? html`<div className="radix-bucket-after-row">
          <span className="radix-bucket-after-title">After regroup&nbsp;</span>
          ${la.map(
            (v, i) =>
              html`<span className="radix-bucket-num-wrap" key=${"af-" + i}>
                <span className="radix-bucket-num-after mono">${v}</span>${i < la.length - 1
                  ? html`<span className="radix-bucket-comma">${", "}</span>`
                  : null}
              </span>`
          )}
        </div>`
      : null;

  return html`<div className="radix-bucket-shell" aria-label="Radix sort buckets">
    <div className="radix-bucket-keys-row">
      ${keys.map(
        (v, i) =>
          html`<span className="radix-bucket-num-wrap" key=${"rk-" + i}>
            <span className="radix-bucket-num mono">${renderNumberWithUnderline(v)}</span>${i < keys.length - 1 ? html`<span className="radix-bucket-comma">${", "}</span>` : null}
          </span>`
      )}
    </div>
    ${viz.phase !== "radixIntro"
      ? html`<p className="radix-bucket-scale-hint">
          Pass by <strong>${viz.placeLabel}</strong> digit
          ${underlineScale ? html` (${"place value " + viz.scale})` : null}.
        </p>`
      : null}
    <div className="radix-bucket-queues">
      ${viz.buckets.map(
        (q, bi) =>
          html`<div className="radix-bucket-queue-slot" key=${"bq-" + bi}>
            <div className="radix-bucket-queue-label">Queue-${bi}</div>
            <div className=${"radix-bucket-u " + (q.length === 0 ? "radix-bucket-u-empty" : "")}>
              <div className="radix-bucket-stack">
                ${[...q]
                  .slice()
                  .reverse()
                  .map(
                    (v, si) =>
                      html`<span className="radix-bucket-queue-val mono" key=${"qv-" + bi + "-" + si}>${v}</span>`
                  )}
              </div>
            </div>
          </div>`
      )}
    </div>
    ${afterRow}
  </div>`;
}
