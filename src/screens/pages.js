import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { html } from "../htm.js";
import SortingPanel from "../components/SortingPanel.js";
import {
  DEMO_ARRAY,
  insertionSortSteps,
  mergeSortSteps,
  heapSortSteps,
  shellSortSteps,
  countSortSteps,
  radixSortSteps,
} from "../engines/sortSteps.js";

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

/** @param {{ fn: (a: number[]) => { caption: string, arr: number[], highlight?: Record<number,string>}[] }} props */
function SortWrap({ fn, title, subtitle, tag, chips }) {
  const { inputStr, setInputStr, arr, load } = useParsedArray();
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
  />`;
}

export function SortShell() {
  return html`<${SortWrap}
    fn=${shellSortSteps}
    title="Shell Sort"
    subtitle="Insertion sort on spaced subsequences—large gaps move values quickly, tightening to gap 1 (Lab gap = n/2, halving)."
    tag=${"comparison"}
    chips=${chip.shell}
  />`;
}

export function SortHeap() {
  return html`<${SortWrap}
    fn=${heapSortSteps}
    title="Heap Sort"
    subtitle="Turn the array into a max-heap, then repeatedly extract the root and sift down—the same heapify loops as heapify() in Lab_8_task.cpp."
    tag=${"comparison"}
    chips=${chip.heap}
  />`;
}

export function SortMerge() {
  return html`<${SortWrap}
    fn=${mergeSortSteps}
    title="Merge Sort"
    subtitle="Divide the range until singletons merge back in sorted order (matches merge() + mergeSort() in Lab)."
    tag=${"comparison"}
    chips=${chip.merge}
  />`;
}

export function SortCount() {
  return html`<${SortWrap}
    fn=${countSortSteps}
    title="Counting Sort"
    subtitle="Count frequencies, prefix-sum for positions, sweep backwards for stability—as in countSort() Lab code."
    tag=${"noncomparison"}
    chips=${chip.count}
  />`;
}

export function SortRadix() {
  return html`<${SortWrap}
    fn=${radixSortSteps}
    title="Radix Sort (LSD)"
    subtitle="Stable digit passes with base-10 counting sort inner loop (countSortRadix + radixSort in Lab)."
    tag=${"noncomparison"}
    chips=${chip.radix}
  />`;
}

/* --- Data structure screens --- */

export function Home() {
  return html`
    <div className="panel">
      <h1>CS Study Lab</h1>
      <p className="subtitle">
        Interactive tour of the sorting algorithms in
        <code style=${{ color: "#3db8ff" }}>Lab_8_task.cpp</code> plus core linear and tree structures. Pick a topic in the
        sidebar—each opens in its own view so you can focus on one idea at a time.
      </p>
      <div className="info-grid">
        <div className="info-chip"><strong>Sorting</strong>Insertion, Shell, Heap, Merge, Count, Radix</div>
        <div className="info-chip"><strong>Linear DS</strong>Linked lists, stacks, queues</div>
        <div className="info-chip"><strong>Trees</strong>BST, Red-Black scenarios, Heaps / priority queues</div>
        <div className="info-chip"><strong>Hashing</strong>Chaining visualization + load factor notes</div>
      </div>
      <p className="prose">
        <strong style=${{ color: "#ffc233" }}>How to run:</strong> ES modules cannot load from
        <code>file://</code>. From this folder run <code style=${{ color: "#3db8ff" }}>node serve.mjs</code> (or double-click
        <code>start-server.bat</code>, which prefers Node then falls back to Python), then open
        <code style=${{ color: "#3db8ff" }}>http://127.0.0.1:8090/</code>.
      </p>
      <p className="prose">
        PDF references on your machine:
        <ul>
          <li><code>C:\\Users\\rasam\\Downloads\\CSE 123_07_red_black_trees_S26.pdf</code></li>
          <li><code>C:\\Users\\rasam\\Downloads\\CSE 123_10_Searching_Hashing_S26.pdf</code></li>
        </ul>
        These panels restate the usual lecture fix-up cases (recolor, rotations) and hash-table collision policies in plain language.
      </p>
    </div>
  `;
}

export function LinkedLists() {
  const [mode, setMode] = useState("single");
  const [values, setValues] = useState([12, 5, 8]);
  const [lastOp, setLastOp] = useState("Push back 21");
  function pushFront() {
    const v = Math.floor(Math.random() * 40 + 1);
    setValues((xs) => [v, ...xs]);
    setLastOp(`Push front ${v}`);
  }
  function pushBack() {
    const v = Math.floor(Math.random() * 40 + 1);
    setValues((xs) => [...xs, v]);
    setLastOp(`Push back ${v}`);
  }
  function popFront() {
    setValues((xs) => xs.slice(1));
    setLastOp("Pop front");
  }
  function popBack() {
    setValues((xs) => xs.slice(0, -1));
    setLastOp("Pop back");
  }
  return html`
    <div className="panel">
      <h1>${mode === "single" ? "Singly Linked List" : "Doubly Linked List"}</h1>
      <p className="subtitle">
        Nodes store data plus next (and prev when doubly). Traversal is sequential:
        singly saves memory; doubly allows O(1) removal if you hold a pointer—visual shows logical links.
      </p>
      <div className="controls">
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
      <motion.div layout className="ll-row">
        ${values.map(
          (v, i) => html`
            <${React.Fragment} key=${v + "-" + i}>
              <${motion.div}
                layout
                initial=${{ opacity: 0, x: -16 }}
                animate=${{ opacity: 1, x: 0 }}
                transition=${{ delay: i * 0.04 }}
                className="node-box active"
              >
                ${v}
              </${motion.div}>
              ${i < values.length - 1
                ? html`<span className="arrow">${mode === "single" ? "→" : "⇄"}</span>`
                : html`<span className="arrow" style=${{ opacity: 0.4 }}>∅</span>`}
            </${React.Fragment}>
          `
        )}
      </motion.div>
      <p className="step-caption">${lastOp}</p>
      <div className="prose">
        <ul>
          <li><b>Singly:</b> one pointer per node—simple, but no backward walk without scanning.</li>
          <li><b>Doubly:</b> extra prev pointer—list iterators and LRU caches love this tradeoff.</li>
        </ul>
      </div>
    </div>
  `;
}

export function StackPage() {
  const [s, setS] = useState([3, 7, 1]);
  const push = () => {
    const v = Math.floor(Math.random() * 20 + 1);
    setS((x) => [...x, v]);
  };
  const pop = () => setS((x) => x.slice(0, -1));
  return html`
    <div className="panel">
      <h1>Stack (LIFO)</h1>
      <p className="subtitle">push adds on top; pop removes the most recent—think call stacks, DFS, undo buffers.</p>
      <div className="controls">
        <button className="btn btn-primary" onClick=${push}>Push</button>
        <button className="btn btn-ghost" onClick=${pop}>Pop</button>
      </div>
      <div style=${{ display: "flex", gap: "1.5rem", alignItems: "flex-end" }}>
        <div className="deck">
          ${[...s].reverse().map((v, i) => html`<div className="deck-item" key=${`s-${s.length}-${i}-${v}`}>${v}</div>`)}
        </div>
        <div className="prose">
          <p><b>Top</b> is animated upward. Amortized O(1) with dynamic array; linked version avoids realloc copy.</p>
        </div>
      </div>
    </div>
  `;
}

export function QueuePage() {
  const [q, setQ] = useState([4, 9, 2]);
  const enqueue = () => {
    const v = Math.floor(Math.random() * 20 + 1);
    setQ((x) => [...x, v]);
  };
  const dequeue = () => setQ((x) => x.slice(1));
  return html`
    <div className="panel">
      <h1>Queue (FIFO)</h1>
      <p className="subtitle">Enqueue at rear, dequeue from front—BFS graphs, buffering, fairness scheduling.</p>
      <div className="controls">
        <button className="btn btn-primary" onClick=${enqueue}>Enqueue</button>
        <button className="btn btn-ghost" onClick=${dequeue}>Dequeue</button>
      </div>
      <motion.div layout className="deck horizontal">
        ${q.map(
          (v, i) => html`<${motion.div} layout className="deck-item" key=${v + "-" + i}>${v}</${motion.div}>`
        )}
      </motion.div>
      <p className="step-caption">Front ← left · Rear → right · circular buffers keep en/dequeue both O(1).</p>
    </div>
  `;
}

function BSTNode(val) {
  return { val, left: null, right: null };
}

/** @returns {any} cloned tree with insert */
function bstInsert(node, val) {
  if (!node) return BSTNode(val);
  if (val <= node.val) node.left = bstInsert(node.left, val);
  else node.right = bstInsert(node.right, val);
  return node;
}

/** inorder assigns x coordinates */
function layout(node, depth, acc) {
  if (!node) return;
  layout(node.left, depth + 1, acc);
  acc.push({
    depth,
    node,
  });
  layout(node.right, depth + 1, acc);
}

export function BSTPage() {
  const [tree, setTree] = useState(() => BSTNode(50));
  const [msg, setMsg] = useState("Start at root 50. Insert duplicates go left.");

  /** @type {{depth:number,val:number,key:string}[]} */
  const nodes = useMemo(() => {
    const list = [];
    layout(tree, 0, list);
    return list.map((o, xi) => ({ depth: o.depth, val: o.node.val, key: `${o.node.val}-${xi}` }));
  }, [tree]);

  function insertRand() {
    const v = Math.floor(Math.random() * 99 + 1);
    setTree((t) => bstInsert(JSON.parse(JSON.stringify(t)), v));
    setMsg(`Inserted ${v}`);
  }

  return html`
    <div className="panel">
      <h1>Binary Search Tree</h1>
      <p className="subtitle">Left subtree ≤ root ≤ right gives in-order sorted stroll; skew degrades into a linked-list height.</p>
      <button className="btn btn-primary" onClick=${insertRand}>Random insert</button>
      <p className="step-caption">${msg}</p>
      <div className="tree-wrap">
        ${Array.from(new Set(nodes.map((n) => n.depth)))
          .sort((a, b) => a - b)
          .map((d) => {
            const row = nodes.filter((n) => n.depth === d);
            return html`<div className="tree-level" key=${"row-" + d}>
              ${row.map(
                (n) => html`<${motion.div}
                  key=${n.key}
                  className="tree-node"
                  layout
                  initial=${{ scale: 0.6, opacity: 0 }}
                  animate=${{ scale: 1, opacity: 1 }}
                >
                  ${n.val}
                </${motion.div}>`
              )}
            </div>`;
          })}
      </div>
      <p className="prose">Rows are depths; horizontal order follows in-order rank. Try skewed inserts to see height growth.</p>
    </div>
  `;
}

/** Scripted RB teaching steps (aligns with standard lecture + CSE 123 PDF themes). */
const RB_SCENARIOS = [
  {
    title: "Case A — Uncle red (recolor + push blackness up)",
    lines: [
      "Insert red node Z; parent P is red; uncle U is red → recolor parent & uncle black, grandparent black→red.",
      "If grandparent becomes red root later, repaint it black.",
    ],
    levels: [[{ val: "G", rb: "black", focus: false }], [{ val: "P", rb: "red", focus: false }, { val: "U", rb: "red", focus: false }], [{ val: "Z", rb: "red", focus: true }]],
  },
  {
    title: "Case B — Triangle (uncle black) rotate parent",
    lines: ["Z is inner grandchild→ rotate parent to line up into case C zig-zig shape."],
    levels: [[{ val: "G", rb: "black", focus: false }], [{ val: "Z", rb: "red", focus: true }, { val: "P", rb: "red", focus: false }]],
  },
  {
    title: "Case C — Line (uncle black) rotate grandparent + recolor",
    lines: ["After rotation, repaint so parent is black & children red—fixes double red while keeping black height.", "These three patterns match the redraw + rotation choreography in RB slide decks."],
    levels: [[{ val: "P", rb: "black", focus: false }], [{ val: "Z", rb: "red", focus: false }, { val: "G", rb: "red", focus: false }]],
  },
];

export function RBTreePage() {
  const [scenario, setScenario] = useState(0);
  const s = RB_SCENARIOS[scenario];
  return html`
    <div className="panel">
      <h1>Red–Black Trees (fix-up cookbook)</h1>
      <p className="subtitle">
        Balanced cousin of BST: black-height equal on all leaf paths + no consecutive reds. Inserts paint red then fix double-red with up to two rotations.
      </p>
      <div className="controls">
        ${RB_SCENARIOS.map(
          (_, i) => html`<button
            className=${i === scenario ? "btn btn-accent" : "btn btn-ghost"}
            onClick=${() => setScenario(i)}
          >
            ${i === 0 ? "Uncle Red" : i === 1 ? "Triangle" : "Line"}
          </button>`
        )}
      </div>
      <h3 style=${{ color: "#ffc233", marginBottom: "0.25rem" }}>${s.title}</h3>
      <div className="tree-wrap">
        ${s.levels.map(
          (row, ri) => html`<div className="tree-level" key=${"rb-" + ri}>
            ${row.map(
              (n) => html`<${motion.div}
                layout
                className=${"tree-node " + (n.rb === "red" ? "red" : "black") + (n.focus ? " focus" : "")}
              >
                ${n.val}
              </${motion.div}>`
            )}
          </div>`
        )}
      </div>
      <div className="prose">
        ${s.lines.map((l) => html`<p>${l}</p>`)}
        <ul>
          <li>Compare with rotations + recoloring slides in your <code>CSE 123_07_red_black_trees_S26.pdf</code>.</li>
          <li>Deletion uses sibling cases (mirror logic) once you mastered insertion visuals.</li>
        </ul>
      </div>
    </div>
  `;
}

export function HeapPQPage() {
  const [vals, setVals] = useState([85, 60, 22, 30, 10, 5, 3]);
  const heapLevelsFromArray = () => {
    /** Level-order slicing: 1,2,4,8… indices like a complete tree in array form. */
    const res = [];
    let i = 0;
    let w = 1;
    while (i < vals.length) {
      res.push(vals.slice(i, Math.min(i + w, vals.length)));
      i += w;
      w <<= 1;
    }
    return res;
  };
  function siftUp(arr) {
    let i = arr.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (arr[p] >= arr[i]) break;
      [arr[p], arr[i]] = [arr[i], arr[p]];
      i = p;
    }
  }
  function pushPQ() {
    const v = Math.floor(Math.random() * 95 + 1);
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
  const levels = heapLevelsFromArray();
  return html`
    <div className="panel">
      <h1>Heap / Priority Queue</h1>
      <p className="subtitle">
        Array-backed complete binary tree: parent ≥ children (max heap). Indexes: parent ⌊(i−1)/2⌋, children 2i+1, 2i+2—exactly heapify indexing in Lab heap sort.
      </p>
      <div className="controls">
        <button className="btn btn-primary" onClick=${pushPQ}>Insert (random)</button>
        <button className="btn btn-ghost" onClick=${popMax}>Extract max</button>
      </div>
      <div className="heap-array">
        ${vals.map(
          (_, i) => html`<span className="heap-cell idx" key=${"idx" + i}>[${i}]</span>`
        )}
      </div>
      <div className="heap-array">
        ${vals.map((v, i) => html`<span className="heap-cell" key=${"v" + i}>${v}</span>`)}
      </div>
      <div className="tree-wrap">
        ${levels.map((row, ri) => html`<div className="tree-level" key=${"heaprow" + ri}>
          ${row.map(
            (v) => html`<${motion.div} layout className="tree-node">${v}</${motion.div}>`
          )}
        </div>`)}
      </div>
      <p className="prose">
        PQ uses the same heap: push sift-up, pop swap root⇄last sift-down—the conceptual twin of extracting max inside heapSort.
      </p>
    </div>
  `;
}

export function HashTablePage() {
  const [m, setM] = useState(7);
  const [pairs] = useState([
    ["apple", 3],
    ["banana", 1],
    ["grapes", 4],
    ["peach", 2],
    ["mango", 5],
    ["pear", 0],
    ["melon", 6],
    ["papaya", 8],
    ["lime", 1],
    ["berry", 2],
  ]);

  /** @type {[string,number][][]} */
  const buckets = useMemo(() => {
    /** @type {[string,number][][]} */
    const b = Array.from({ length: m }, () => []);
    for (const [k, v] of pairs) {
      let h = 0;
      for (let i = 0; i < k.length; i++) h = (h * 131 + k.charCodeAt(i)) >>> 0;
      b[h % m].push([k, v]);
    }
    return b;
  }, [m]);

  const load = buckets.reduce((a, ch) => a + ch.length, 0) / m;

  return html`
    <div className="panel">
      <h1>Hash Tables (chaining demo)</h1>
      <p className="subtitle">
        Map keys→buckets via h(k) mod m. Collisions live in chains (lecture slide style from your hashing PDF). Alternate world: open addressing probes linearly/quadratically.
      </p>
      <label className="slider-row"
        ><span># buckets ${m}</span>
        <input type="range" min="5" max="11" step="1" value=${m} onChange=${(e) => setM(Number(e.target.value))} />
      </label>
      <p className="step-caption">Average chain length ~ load factor λ = α = n/m ≈ ${load.toFixed(2)} · Expect Θ(1+) find if λ stays small & h spreads keys.</p>
      <div className="hash-buckets">
        ${buckets.map(
          (chain, idx) =>
            html`<div className="hash-bucket" key=${"buck" + idx}>
              <div className="hash-bucket-label">${idx}</div>
              <div className="hash-chain">
                ${chain.map(
                  ([k, vv]) =>
                    html`<span className="kv-pill" key=${k + vv}>${k}:${vv}</span>`
                )}
              </div>
            </div>`
        )}
      </div>
      <div className="prose">
        <ul>
          <li><b>Open addressing:</b> store directly in slots; probes walk until empty—clusters hurt performance.</li>
          <li><b>Rolling hash / double hashing:</b> reduce clustering (themes in CSE 123_10_Searching_Hashing_S26).</li>
        </ul>
      </div>
    </div>
  `;
}
