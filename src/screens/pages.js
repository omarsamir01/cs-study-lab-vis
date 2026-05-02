import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { html } from "../htm.js";
import SortingPanel from "../components/SortingPanel.js";
import TreeChart from "../components/TreeChart.js";
import HeapChart from "../components/HeapChart.js";
import { cloneInsertBST, nextBstIdFactory } from "../engines/bst.js";
import { inorderIds, postorderIds, preorderIds } from "../lib/treeLayout.js";
import { rbInsert, rbClear } from "../engines/rbTree.js";
import {
  DEMO_ARRAY,
  DEMO_ARRAY_COUNT,
  DEMO_ARRAY_HEAP,
  DEMO_ARRAY_INSERTION,
  DEMO_ARRAY_MERGE,
  DEMO_ARRAY_RADIX,
  DEMO_ARRAY_SHELL,
  insertionSortSteps,
  mergeSortSteps,
  heapSortSteps,
  shellSortSteps,
  countSortSteps,
  radixSortSteps,
} from "../engines/sortSteps.js";

/** Author & repo links shown on the welcome screen */
const WELCOME_AUTHOR = {
  name: "Omar Samir",
  githubHandle: "omarsamir01",
  email: "omarsamir078@gmail.com",
  repoUrl: "https://github.com/omarsamir01/cs-study-lab-vis",
};

const HT_WORD_PARTS = [
  "maple",
  "river",
  "nimbus",
  "orbit",
  "radix",
  "shard",
  "vault",
  "pulse",
  "nova",
  "glyph",
  "flux",
  "apex",
  "blink",
  "delta",
  "prism",
  "quartz",
];

/** Rolling hash aligned with HashTablePage bucket logic. */
function htHashDig(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 131 + key.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

/** @returns {number} bucket index mod m */
function htBucketMod(key, m) {
  return htHashDig(key) % m;
}

/** Pronounceable key; collisions across buckets explored via nonce. */
function htReadableKey(nonce) {
  const a = HT_WORD_PARTS[nonce % HT_WORD_PARTS.length];
  const b = HT_WORD_PARTS[(nonce >>> 7) % HT_WORD_PARTS.length];
  return `${a}-${b}-${nonce.toString(36)}`;
}

/**
 * Finds a readable key landing in bucket (for chained-collision demos).
 * Always returns within a few thousand tries for small m via dense nonce scan.
 */
function htForceBucketKey(m, targetBucket, seed) {
  for (let t = 0; t < 12000; t++) {
    const k = htReadableKey(seed + t * 7919);
    if (htBucketMod(k, m) === targetBucket) return k;
  }
  for (let z = 0; z < 50000; z++) {
    const k = `rk${seed}_${z}`;
    if (htBucketMod(k, m) === targetBucket) return k;
  }
  return `rk${seed}-fallback`;
}

/** Singly: straight next arrow. Doubly: faint reverse prev stacked above — monochrome like insertion-links, flat (no Bézier). */
function LinkArrowGlue({ doubly }) {
  const next = html`<svg className="ll-svg-arrow ll-svg-arrow--straight" viewBox="0 0 76 22" aria-hidden="true">
    <line
      x1="10"
      y1="11"
      x2="52"
      y2="11"
      fill="none"
      stroke="rgba(255, 255, 255, 0.92)"
      stroke-width="2"
      stroke-linecap="round"
    />
    <polygon points="66,11 52,9 52,14" fill="rgba(255,255,255,0.92)" />
  </svg>`;
  if (!doubly) return html`<div className="ll-connect">${next}</div>`;
  const prev = html`<svg className="ll-svg-arrow ll-svg-arrow--straight ll-svg-arrow--backward" viewBox="0 0 76 22" aria-hidden="true">
    <line
      x1="66"
      y1="11"
      x2="22"
      y2="11"
      fill="none"
      stroke="rgba(255, 255, 255, 0.52)"
      stroke-width="2"
      stroke-linecap="round"
    />
    <polygon points="10,11 22,9 22,14" fill="rgba(255,255,255,0.52)" />
  </svg>`;
  return html`<div className="ll-connect doubly">${prev}${next}</div>`;
}

function useParsedArray(defaults = DEMO_ARRAY) {
  const [inputStr, setInputStr] = useState(defaults.join(", "));
  const [arr, setArr] = useState(defaults);
  const load = () => {
    const next = inputStr
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n))
      .slice(0, 24);
    if (next.length) setArr(next);
  };
  return { inputStr, setInputStr, arr, load };
}

/** @param {{ fn: (a: number[]) => any, title: string, subtitle: string, tag: string, chips: any[], vizMode?: string, defaultArray?: number[] }} props */
function SortWrap({ fn, title, subtitle, tag, chips, vizMode, defaultArray }) {
  const { inputStr, setInputStr, arr, load } = useParsedArray(defaultArray ?? DEMO_ARRAY);
  const steps = useMemo(() => fn(arr), [fn, arr]);
  return html`<${SortingPanel}
    title=${title}
    subtitle=${subtitle}
    tag=${tag}
    chips=${chips}
    steps=${steps}
    inputStr=${inputStr}
    setInputStr=${setInputStr}
    onLoad=${load}
    vizMode=${vizMode}
  />`;
}

const chip = {
  insertion: [
    { label: "Time", value: "O(n²); best O(n) if nearly sorted." },
    { label: "Space", value: "O(1) in-place (Lab insertion sort)." },
  ],
  shell: [
    { label: "Time", value: "Gap-dependent; avg between O(n^1.25)–O(n^1.5), worst O(n²) (Lab)." },
    { label: "Space", value: "O(1) — in-place." },
  ],
  heap: [
    { label: "Time", value: "O(n log n) comparisons." },
    { label: "Space", value: "O(log n) recursion stack per Lab; iterative O(1)." },
  ],
  merge: [
    { label: "Time", value: "O(n log n) divide & conquer." },
    { label: "Space", value: "O(n) auxiliary arrays for merge (Lab)." },
  ],
  count: [
    { label: "Time", value: "O(n + m) with range m → max element." },
    { label: "Space", value: "O(n + m) counting + output (Lab)." },
  ],
  radix: [
    { label: "Time", value: "O(d · (n + k)) digits d, base k." },
    { label: "Space", value: "O(n + k) temporary buckets/counts." },
  ],
};

export function SortInsertion() {
  return html`<${SortWrap}
    fn=${insertionSortSteps}
    title="Insertion Sort"
    subtitle="Shift larger elements right; drop the key when the left neighbor is smaller. Exactly the strategy in your Lab array walk."
    tag=${"comparison"}
    chips=${chip.insertion}
    vizMode=${"insertion"}
    defaultArray=${DEMO_ARRAY_INSERTION}
  />`;
}

export function SortShell() {
  return html`<${SortWrap}
    fn=${shellSortSteps}
    title="Shell Sort"
    subtitle="Insertion sort on spaced subsequences—large gaps move values quickly, tightening to gap 1 (Lab gap = n/2, halving)."
    tag=${"comparison"}
    chips=${chip.shell}
    defaultArray=${DEMO_ARRAY_SHELL}
  />`;
}

export function SortHeap() {
  return html`<${SortWrap}
    fn=${heapSortSteps}
    title="Heap Sort"
    subtitle="Turn the array into a max-heap, then repeatedly extract the root and sift down—the usual heapify / sift-down loops on an array-backed heap."
    tag=${"comparison"}
    chips=${chip.heap}
    defaultArray=${DEMO_ARRAY_HEAP}
  />`;
}

export function SortMerge() {
  return html`<${SortWrap}
    fn=${mergeSortSteps}
    title="Merge Sort"
    subtitle="Divide the range until singletons merge back in sorted order (matches merge() + mergeSort() in Lab)."
    tag=${"comparison"}
    chips=${chip.merge}
    defaultArray=${DEMO_ARRAY_MERGE}
  />`;
}

export function SortCount() {
  return html`<${SortWrap}
    fn=${countSortSteps}
    title="Counting Sort"
    subtitle="Count frequencies, prefix-sum for positions, sweep backwards for stability—as in countSort() Lab code."
    tag=${"noncomparison"}
    chips=${chip.count}
    defaultArray=${DEMO_ARRAY_COUNT}
  />`;
}

export function SortRadix() {
  return html`<${SortWrap}
    fn=${radixSortSteps}
    title="Radix Sort (LSD)"
    subtitle="Stable digit passes with base-10 counting sort inner loop (countSortRadix + radixSort in Lab)."
    tag=${"noncomparison"}
    chips=${chip.radix}
    defaultArray=${DEMO_ARRAY_RADIX}
  />`;
}

/* --- Data structure screens --- */

export function Home() {
  const { name, githubHandle, email, repoUrl } = WELCOME_AUTHOR;
  return html`
    <div className="panel">
      <h1>DSA</h1>
      <div className="welcome-about callout-soft" style=${{ marginBottom: "1rem" }}>
        <p className="subtitle" style=${{ marginBottom: "0.65rem" }}>
          Hi—I'm <strong>${name}</strong> (
          <a href=${`https://github.com/${githubHandle}`} target="_blank" rel="noopener noreferrer">${githubHandle}</a>
          ). I built this site to make data structures and sorting algorithms easier to visualize, trace step by step,
          and reason about.
        </p>
        <p className="subtitle" style=${{ marginBottom: "0.65rem" }}>
          You'll find sorting visualizers plus linked lists, stacks, queues, trees, heaps, and hashing—all on separate
          screens so you can focus on one idea at a time.
        </p>
        <p className="subtitle" style=${{ marginBottom: 0 }}>
          If this helps you, please <strong>star</strong> the repo on GitHub, share it with classmates, and bookmark it for
          later review. I welcome contributions, feedback, or ideas—from small typo fixes to new diagrams.
        </p>
      </div>
      <p className="subtitle">
        Interactive tour—pick a topic in the sidebar; each screen opens its own focused view.
      </p>
      <div className="welcome-contact prose" style=${{ margin: "1rem 0" }}>
        <strong className="code-accent">Contact:</strong> For anything about this repo—bugs, forks, or
        collaborations—email me at ${" "}
        <a href=${`mailto:${email}?subject=${encodeURIComponent("DSA visualization site")}`}>${email}</a>
        . You can also use the Issues tab:${" "}
        <a href=${`${repoUrl}/issues`} target="_blank" rel="noopener noreferrer">${repoUrl}/issues</a>
        . Source code:${" "}
        <a href=${repoUrl} target="_blank" rel="noopener noreferrer">${repoUrl}</a>.
      </div>
      <div className="callout-soft">
        <strong>Hosted on GitHub Pages?</strong> Scripts load from jsDelivr—if the tab stays blank, hard-refresh
        (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>) or try another browser; campus networks sometimes filter ES module CDNs.
      </div>
      <div className="info-grid">
        <div className="info-chip"><strong>Sorting</strong>Insertion, Shell, Heap, Merge, Count, Radix</div>
        <div className="info-chip"><strong>Linear DS</strong>Linked lists, stacks, queues</div>
        <div className="info-chip"><strong>Trees</strong>BST, Red-Black scenarios, Heaps / priority queues</div>
        <div className="info-chip"><strong>Hashing</strong>Chaining visualization + load factor notes</div>
      </div>
      <p className="prose">
        <strong className="code-accent">How to run locally:</strong> ES modules cannot load from
        <code>file://</code>. From this folder run <code className="code-accent">node serve.mjs</code> or
        <code>start-server.bat</code>, then open <code className="code-accent">http://127.0.0.1:8090/</code>.
      </p>
    </div>
  `;
}

export function LinkedLists() {
  const [mode, setMode] = useState("single");
  const nid = useRef(3);
  /** @type {[{ id: string, val: number }]} */
  const [cells, setCells] = useState([
    { id: "n0", val: 12 },
    { id: "n1", val: 5 },
    { id: "n2", val: 8 },
  ]);
  const [inp, setInp] = useState("");

  function parseTyped() {
    const v = parseInt(String(inp).trim(), 10);
    return Number.isFinite(v) ? v : null;
  }

  function pushFront() {
    const t = parseTyped();
    const v = t != null ? t : Math.floor(Math.random() * 40 + 1);
    if (t != null) setInp("");
    const id = `n${nid.current++}`;
    setCells((xs) => [{ id, val: v }, ...xs]);
  }
  function pushBack() {
    const t = parseTyped();
    const v = t != null ? t : Math.floor(Math.random() * 40 + 1);
    if (t != null) setInp("");
    const id = `n${nid.current++}`;
    setCells((xs) => [...xs, { id, val: v }]);
  }
  function popFront() {
    setCells((xs) => xs.slice(1));
  }
  function popBack() {
    setCells((xs) => xs.slice(0, -1));
  }
  return html`
    <div className="panel">
      <h1>${mode === "single" ? "Singly Linked List" : "Doubly Linked List"}</h1>
      <p className="subtitle">
        Each node remembers one value plus the next hop (prev & next when doubly). Arrows visualize the traversal order students follow on paper exams.
      </p>
      <div className="controls">
        <span className="slider-row"
          >Value
          <input type="number" placeholder="omit for random (1..40)" style=${{ width: 150 }}
            value=${inp} onChange=${(e) => setInp(e.target.value)}
        /></span>
        <button className=${`btn btn-ghost ${mode === "single" ? "btn-accent" : ""}`} onClick=${() => setMode("single")}>
          Singly
        </button>
        <button className=${`btn btn-ghost ${mode === "doubly" ? "btn-accent" : ""}`} onClick=${() => setMode("doubly")}>
          Doubly
        </button>
        <button className="btn btn-primary" onClick=${pushFront}>Push front</button>
        <button className="btn btn-primary" onClick=${pushBack}>Push back</button>
        <button className="btn btn-ghost" onClick=${popFront}>Pop front</button>
        <button className="btn btn-ghost" onClick=${popBack}>Pop back</button>
      </div>
      <div className="viz-page-main">
        <motion.div layout className="ll-row">
        ${cells.map(
          (cell, i) => html`
            <${React.Fragment} key=${cell.id}>
              <${motion.div}
                layout
                initial=${{ opacity: 0, x: -16 }}
                animate=${{ opacity: 1, x: 0 }}
                transition=${{ delay: i * 0.04 }}
                className="node-box active"
              >
                ${cell.val}
              </${motion.div}>
              ${i < cells.length - 1
                ? html`<${LinkArrowGlue} doubly=${mode === "doubly"} />`
                : html`<span className="ll-tail">∅ nil</span>`}
            </${React.Fragment}>
          `
        )}
      </motion.div>
      </div>
      <div className="callout-soft">Leave the value blank for a random 1–40 push; type a number to push that instead.</div>
      <div className="prose">
        <ul>
          <li><b>Singly:</b> one direction—smallest memory footprint.</li>
          <li><b>Doubly:</b> faint reverse arrow sketches the extra prev link.</li>
        </ul>
      </div>
    </div>
  `;
}

export function StackPage() {
  const [s, setS] = useState([
    { id: "s0", v: 3 },
    { id: "s1", v: 7 },
    { id: "s2", v: 1 },
  ]);
  const sid = useRef(10);
  const [inp, setInp] = useState("");
  const pushRand = () => {
    const t = parseInt(inp.trim(), 10);
    const v = Number.isFinite(t) ? t : Math.floor(Math.random() * 20 + 1);
    if (!Number.isFinite(t)) setInp("");
    else setInp("");
    setS((x) => [...x, { id: `s${sid.current++}`, v }]);
  };
  const pop = () => setS((x) => x.slice(0, -1));
  return html`
    <div className="panel">
      <h1>Stack (LIFO)</h1>
      <p className="subtitle">push piles on TOP; pop peels that same tier—everything below waits.</p>
      <div className="controls">
        <span className="slider-row"
          ><input type="number" placeholder="value" style=${{ width: 100 }} value=${inp}
            onChange=${(e) => setInp(e.target.value)} /></span>
        <button className="btn btn-primary" onClick=${pushRand}>Push typed (or rnd if blank)</button>
        <button className="btn btn-ghost" onClick=${pop}>Pop</button>
      </div>
      <div className="stack-page-stage viz-page-main">
        <div className="stack-diagram-visual">
          <div className="stack-guide">
            <span className="guide-label">TOP of stack →</span>
            <span className="guide-label subtle">Push / Pop here</span>
            <span className="stack-arrow-to-top">▲</span>
          </div>
          <div className="deck stack-deck">
            ${[...s].reverse().map(
              (cell) => html`<div className="deck-item stack-disk" key=${cell.id}>${cell.v}</div>`
            )}
          </div>
          <span className="guide-label stack-bottom-label">BOTTOM (first pushed)</span>
        </div>
      </div>
      <p className="step-caption stack-page-note">
        Blank push fills in a random drill value unless you type a number. Listed top→bottom matches the pile: newest on top.
      </p>
    </div>
  `;
}

export function QueuePage() {
  const qid = useRef(5);
  const [q, setQ] = useState([
    { id: "q0", v: 4 },
    { id: "q1", v: 9 },
    { id: "q2", v: 2 },
  ]);
  const [inp, setInp] = useState("");
  const enqueue = () => {
    const t = parseInt(inp.trim(), 10);
    const v = Number.isFinite(t) ? t : Math.floor(Math.random() * 20 + 1);
    setInp("");
    setQ((x) => [...x, { id: `q${qid.current++}`, v }]);
  };
  const dequeue = () => setQ((x) => x.slice(1));
  return html`
    <div className="panel">
      <h1>Queue (FIFO)</h1>
      <p className="subtitle">enqueue grows the rear tail; dequeue always pops the farthest-front cell.</p>
      <div className="controls">
        <span className="slider-row"
          ><input type="number" placeholder="value" style=${{ width: 120 }} value=${inp}
            onChange=${(e) => setInp(e.target.value)} /></span>
        <button className="btn btn-primary" onClick=${enqueue}>Enqueue typed (or rnd blank)</button>
        <button className="btn btn-ghost" onClick=${dequeue}>Dequeue</button>
      </div>
      <div className="viz-page-main">
      <div className="queue-flow">
        <div className="queue-axis">
          <span>Front — dequeue</span>
          <span>Rear — enqueue</span>
        </div>
        <div className="queue-svg-wrap">
          <svg viewBox="0 0 400 22" width="100%" height="22" preserveAspectRatio="none" aria-hidden="true">
            <line x1="8" y1="11" x2="392" y2="11" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" />
            <polygon points="392,11 382,6 382,16" fill="currentColor" />
          </svg>
        </div>
      </div>
      <motion.div layout className="deck horizontal">
        ${q.map(
          (cell) =>
            html`<${motion.div} layout className="deck-item" key=${cell.id}>${cell.v}</${motion.div}>`
        )}
      </motion.div>
      </div>
      <div className="step-caption">
        Cells slide on the dashed axis: arrivals queue on the right, departures peel from the left (ring buffers mimic this logically).
      </div>
    </div>
  `;
}

export function BSTPage() {
  const makeId = useMemo(() => nextBstIdFactory(), []);
  const [tree, setTree] = useState(null);
  const [inp, setInp] = useState("");
  const [note, setNote] = useState("Start empty—or insert typed / random ints to grow the BST.");
  /** @type {null | "in" | "pre" | "post"} */
  const [walkMode, setWalkMode] = useState(null);
  const [walkIdx, setWalkIdx] = useState(0);
  const [walkPlay, setWalkPlay] = useState(false);

  const walkOrder = useMemo(() => {
    if (!tree || !walkMode) return [];
    if (walkMode === "in") return inorderIds(tree);
    if (walkMode === "pre") return preorderIds(tree);
    return postorderIds(tree);
  }, [tree, walkMode]);

  useEffect(() => {
    setWalkIdx(0);
    setWalkPlay(false);
  }, [walkMode, tree]);

  useEffect(() => {
    if (!walkPlay || !walkOrder.length) return;
    const id = window.setInterval(() => {
      setWalkIdx((i) => {
        if (i >= walkOrder.length - 1) {
          setWalkPlay(false);
          return 0;
        }
        return i + 1;
      });
    }, 680);
    return () => window.clearInterval(id);
  }, [walkPlay, walkOrder.length]);

  const highlightId =
    tree && walkMode && walkOrder.length ? walkOrder[walkIdx % walkOrder.length] : null;

  function typedInsertOrRandom(rand) {
    const t = parseInt(inp.trim(), 10);
    const v = rand ? Math.floor(Math.random() * 90 + 1) : t;
    if (!rand && !Number.isFinite(v)) return;
    setTree((prev) => cloneInsertBST(prev, v, makeId));
    setInp("");
    setNote(rand ? `Random insert ${v} (duplicates ≤ go left)` : `Inserted ${v}`);
  }

  return html`<div className="panel">
    <h1>Binary Search Tree</h1>
    <p className="subtitle">
      Parent→child arrows follow real edges. Traversal controls highlight visit order; duplicates use the ≤ → left rule.
    </p>
    <div className="controls">
      <input type="number" placeholder="value" style=${{ width: 110 }} value=${inp} onChange=${(e) => setInp(e.target.value)} />
      <button className="btn btn-primary" onClick=${() => typedInsertOrRandom(false)}>Insert typed</button>
      <button className="btn btn-primary" onClick=${() => typedInsertOrRandom(true)}>Insert random</button>
      <button className="btn btn-ghost" onClick=${() => { setTree(null); setWalkMode(null); setNote("Cleared."); }}>Clear tree</button>
    </div>
    <div className="controls">
      <span className="slider-row"><strong style=${{ marginRight: 6 }}>Traversals</strong></span>
      <button className=${walkMode === "in" ? "btn btn-accent" : "btn btn-ghost"} onClick=${() => setWalkMode("in")}>In-order</button>
      <button className=${walkMode === "pre" ? "btn btn-accent" : "btn btn-ghost"} onClick=${() => setWalkMode("pre")}>Pre-order</button>
      <button className=${walkMode === "post" ? "btn btn-accent" : "btn btn-ghost"} onClick=${() => setWalkMode("post")}>Post-order</button>
      <button className="btn btn-ghost" onClick=${() => setWalkMode(null)}>Traversal off</button>
      ${walkOrder.length > 0
        ? html`<button className="btn btn-ghost" onClick=${() => setWalkPlay((x) => !x)}>${walkPlay ? "Pause walk" : "Play walk"}</button>`
        : null}
      ${walkOrder.length > 0
        ? html`<button className="btn btn-ghost" onClick=${() => setWalkIdx((i) => (i + 1) % walkOrder.length)}>Step</button>`
        : null}
    </div>
    <p className="step-caption">${note}</p>
    ${walkMode && walkOrder.length
      ? html`<div className="traverse-strip">
          ${walkMode} sequence:
          <span className="traverse-seq">${walkOrder.join(" → ")}</span>
          — active step ${walkIdx + 1} / ${walkOrder.length}
        </div>`
      : null}
    <div className="tree-wrap viz-page-main">
      <${TreeChart} root=${tree} colored=${false} highlightId=${highlightId} />
    </div>
  </div>`;
}

export function RBTreePage() {
  const wb = useRef({ root: /** @type {any} */ (null) });
  const [rbTick, setRbTick] = useState(0);
  const rerender = () => setRbTick((x) => x + 1);
  const [inp, setInp] = useState("");
  const [msg, setMsg] = useState("Insert integers; BST insert paints red leaf, fix-up rotates/recolors.");

  function add(rand) {
    const t = parseInt(inp.trim(), 10);
    const v = rand ? Math.floor(Math.random() * 90 + 1) : t;
    if (!rand && !Number.isFinite(v)) return;
    try {
      rbInsert(wb.current, v);
      setMsg(`Inserted ${v} (CLR-style fix-up)`);
      if (!rand) setInp("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
    rerender();
  }

  return html`<div className="panel">
    <h1>Red–Black Tree</h1>
    <p className="subtitle">
      Dynamic insertions keep black-height balanced. Rose discs = RED, graphite discs = BLACK. Edges reconnect after rotations.
    </p>
    <div className="controls">
      <input type="number" value=${inp} onChange=${(e) => setInp(e.target.value)} placeholder="value" style=${{ width: 100 }} />
      <button className="btn btn-primary" onClick=${() => add(false)}>Insert typed</button>
      <button className="btn btn-primary" onClick=${() => add(true)}>Insert random</button>
      <button className="btn btn-ghost" onClick=${() => { rbClear(wb.current); rerender(); setMsg("Reset."); }}>Clear</button>
    </div>
    <p className="step-caption">${msg}</p>
    <div className="tree-wrap viz-page-main">
      <${TreeChart} root=${wb.current.root} colored=${true} highlightId=${null} rev=${rbTick} />
    </div>
  </div>`;
}

export function HeapPQPage() {
  const [vals, setVals] = useState([85, 60, 22, 30, 10, 5, 3]);
  const [inp, setInp] = useState("");

  function siftUp(arr) {
    let i = arr.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (arr[p] >= arr[i]) break;
      [arr[p], arr[i]] = [arr[i], arr[p]];
      i = p;
    }
  }
  function pushPQ(rand) {
    const t = parseInt(inp.trim(), 10);
    const v = rand ? Math.floor(Math.random() * 95 + 1) : t;
    if (!rand && !Number.isFinite(v)) return;
    if (!rand) setInp("");
    const next = [...vals, v];
    siftUp(next);
    setVals(next);
  }
  function popMax() {
    if (vals.length <= 1) {
      setVals([]);
      return;
    }
    const next = [...vals];
    next[0] = next[next.length - 1];
    next.pop();
    let i = 0;
    while (true) {
      let l = 2 * i + 1,
        r = 2 * i + 2,
        m = i;
      if (l < next.length && next[l] > next[m]) m = l;
      if (r < next.length && next[r] > next[m]) m = r;
      if (m === i) break;
      [next[i], next[m]] = [next[m], next[i]];
      i = m;
    }
    setVals(next);
  }

  return html`<div className="panel">
    <h1>Heap / Priority Queue</h1>
    <p className="subtitle">Edges connect array indices i ↔ parent ⌊(i−1)/2⌋. Max heap: parent dominates children.</p>
    <div className="controls">
      <input type="number" placeholder="value" style=${{ width: 100 }} value=${inp} onChange=${(e) => setInp(e.target.value)} />
      <button className="btn btn-primary" onClick=${() => pushPQ(false)}>Insert typed</button>
      <button className="btn btn-primary" onClick=${() => pushPQ(true)}>Insert random</button>
      <button className="btn btn-ghost" onClick=${popMax}>Extract max</button>
      <button className="btn btn-ghost" onClick=${() => setVals([])}>Clear</button>
    </div>
    <div className="viz-page-main">
    ${vals.length
      ? html`<div
          className="heap-array-grid"
          style=${{ gridTemplateColumns: `repeat(${vals.length}, minmax(3.25rem, 1fr))` }}
        >
          ${vals.map(
            (v, i) =>
              html`<div className="heap-array-col" key=${"hc-" + i}>
                <span className="heap-cell idx mono">[${i}]</span>
                <span className="heap-cell mono">${v}</span>
              </div>`
          )}
        </div>`
      : null}
    <${HeapChart} vals=${vals} />
    </div>
  </div>`;
}

export function HashTablePage() {
  const [m, setM] = useState(7);
  const hid = useRef(50);
  const [pairs, setPairs] = useState(() => [
    ["apple", 3],
    ["banana", 1],
  ]);
  const [keyIn, setKeyIn] = useState("");
  const [valIn, setValIn] = useState("0");

  const buckets = useMemo(() => {
    const b = Array.from({ length: m }, () => []);
    for (const [k, v] of pairs) {
      let h = 0;
      for (let i = 0; i < k.length; i++) h = (h * 131 + k.charCodeAt(i)) >>> 0;
      b[h % m].push([k, v]);
    }
    return b;
  }, [m, pairs]);

  const alpha = pairs.length ? pairs.length / m : 0;

  function addPair() {
    const k = keyIn.trim() || `slot-${hid.current++}`;
    const vv = parseInt(valIn, 10);
    const v = Number.isFinite(vv) ? vv : 0;
    setPairs((p) => [...p, [k, v]]);
    setKeyIn("");
  }

  /**
   * Add random KV pairs using the same polynomial hash so chains grow naturally.
   * Biases toward existing buckets so collisions/teaching demos show up reliably.
   */
  function insertRandomPairs(count, { biasChains = true } = {}) {
    setPairs((prev) => {
      const out = [...prev];
      const id0 = hid.current;
      for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * 99) + 1;
        const seed = id0 + i * 982451653;
        let key;
        if (biasChains && out.length > 0 && Math.random() < 0.54) {
          const refKey = out[Math.floor(Math.random() * out.length)][0];
          key = htForceBucketKey(m, htBucketMod(refKey, m), seed);
        } else {
          key = htReadableKey(seed ^ (i << 17));
        }
        out.push([key, value]);
      }
      hid.current = id0 + count;
      return out;
    });
  }

  return html`<div className="panel">
    <h1>Hash Tables (chaining)</h1>
    <p className="subtitle">Add string keys dynamically; chaining stacks collisions inside each modulus bucket.</p>
    <div className="controls">
      <input placeholder="value" style=${{ width: 140 }} value=${keyIn} onChange=${(e) => setKeyIn(e.target.value)} />
      <input type="number" placeholder="value" style=${{ width: 90 }} value=${valIn} onChange=${(e) => setValIn(e.target.value)} />
      <button className="btn btn-primary" onClick=${addPair}>Insert</button>
      <button className="btn btn-accent" onClick=${() => insertRandomPairs(1)} title="Adds a pronounceable random key/value; biased to reuse buckets so chaining is visible">
        Random insert
      </button>
      <button className="btn btn-ghost" onClick=${() => insertRandomPairs(10)}
        title="Ten random pairs (~half aim for hash collisions)"
        aria-label="Insert ten random pairs"
      >
        Bulk +10
      </button>
      <button className="btn btn-ghost" onClick=${() => setPairs((p) => p.slice(0, Math.max(0, p.length - 1)))}>Pop pair</button>
      <button className="btn btn-ghost" onClick=${() => setPairs([])}>Clear all</button>
    </div>
    <label className="slider-row"
      ><span>Buckets ${m}</span>
      <input type="range" min="5" max="13" step="1" value=${m} onChange=${(e) => setM(Number(e.target.value))} />
    </label>
    <p className="step-caption">Load factor α = n/m ≈ ${alpha.toFixed(2)} with ${pairs.length} entries.</p>
    <div className="hash-buckets viz-page-main">
      ${buckets.map(
        (chain, idx) =>
          html`<div className="hash-bucket" key=${"bk-" + idx}>
            <div className="hash-bucket-label">${idx}</div>
            <div className="hash-chain">
              ${chain.map(
                ([k, vv], ci) =>
                  html`<span className="kv-pill" key=${`${k}:${vv}:${ci}`}>${k}:${vv}</span>`
              )}
            </div>
          </div>`
      )}
    </div>
  </div>`;
}
