import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { html } from "../htm.js";

/**
 * @param {{
 *  title: string,
 *  subtitle: string,
 *  tag: string,
 *  chips: { label: string, value: string }[],
 *  steps: { caption: string, arr: number[], highlight?: Record<number,string> }[],
 *  onArrayChange?: (next: number[]) => void,
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

  const barGrad = (i, marks) => {
    if (marks === "highlight") return "linear-gradient(180deg, #ffc233 0%, #ff6b9d 100%)";
    if (marks === "pivot") return "linear-gradient(180deg, #00d4aa 0%, #3db8ff 100%)";
    if (marks === "range") return "linear-gradient(180deg, #7c5cff 0%, #3db8ff 90%)";
    const v = cur.arr[i] ?? 0;
    const hue = 220 + ((v % 17) / 17) * 80;
    return `linear-gradient(180deg, hsl(${hue}, 92%, 58%) 0%, hsl(${hue}, 85%, 38%) 100%)`;
  };

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
      <div className="controls">
        <textarea
          rows="2"
          style=${{ width: "100%", maxWidth: 420, resize: "vertical", padding: "0.5rem", borderRadius: "8px", border: "1px solid rgba(168,140,255,0.35)", background: "rgba(0,0,0,0.25)", color: "#eee", fontFamily: "var(--font-mono)" }}
          value=${inputStr}
          onChange=${(e) => setInputStr(e.target.value)}
        />
        <button className="btn btn-primary" onClick=${onLoad}>Load numbers</button>
        <button className="btn btn-accent" onClick=${() => { setIdx(0); setPlaying(true); }}>Play</button>
        <button className="btn btn-ghost" onClick=${() => setPlaying(false)}>Pause</button>
        <button className="btn btn-ghost" onClick=${() => setIdx(0)}>Reset</button>
        <button className="btn btn-ghost" onClick=${() => setIdx(Math.max(0, idx - 1))}>◀ Step</button>
        <button className="btn btn-ghost" onClick=${() => setIdx(Math.min(steps.length - 1, idx + 1))}>
          Step ▶
        </button>
        <span className="slider-row">
          Slow
          <input
            type="range"
            min="120"
            max="900"
            value=${speed}
            onChange=${(e) => setSpeed(Number(e.target.value))}
          />
          Fast
        </span>
        <span className="slider-row">${steps.length ? idx + 1 : 0} / ${steps.length}</span>
      </div>
      <${AnimatePresence} mode="wait">
        <motion.div
          key=${idx}
          initial=${{ opacity: 0.35, y: 6 }}
          animate=${{ opacity: 1, y: 0 }}
          exit=${{ opacity: 0.2 }}
          transition=${{ duration: 0.22 }}
          className="array-viz"
        >
          ${cur.arr.map(
            (v, i) => html`<${motion.div}
                key=${String(i)}
                layout
                className=${"bar " + ((cur.highlight && cur.highlight[i]) || "")}
                title=${`${i}: ${v}`}
                style=${{
                  height: `${(v / maxVal) * 110 + 18}px`,
                  background: barGrad(i, cur.highlight && cur.highlight[i]),
                }}
                initial=${{ scaleY: 0.75 }}
                animate=${{ scaleY: 1 }}
                transition=${{ type: "spring", stiffness: 420, damping: 28 }}
              >
                ${v}
              </${motion.div}>`
          )}
        </motion.div>
      </${AnimatePresence}>
      <p className="step-caption">${cur.caption}</p>
      <p style=${{ marginTop: "1rem", color: "#a59fd4", fontSize: "0.85rem" }}>
        Tip: pause and single-step while reviewing. Default list matches
        <code style=${{ color: "#3db8ff" }}> Lab_8_task.cpp </code>.
      </p>
    </div>
  `;
}
