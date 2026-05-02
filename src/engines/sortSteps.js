/**
 * Builds step arrays for sorting visualizers.
 * Pedagogical step logic aligned with common array-based sort implementations.
 */

import { computeMergeDiagramPhases } from "../lib/mergeSortDiagram.js";

/**
 * @typedef {{
 *   caption: string,
 *   arr: number[],
 *   highlight?: Record<number,string>,
 *   radixScale?: number,
 *   radixShowDigitStrip?: boolean,
 *   shellGap?: number,
 *   shellPrevGap?: number | null,
 *   mergeDiagramPhases?: Array<{ phase: string, chunks: number[][], caption: string }>,
 *   mergeRevealExclusive?: number,
 *   countingViz?: {
 *    phase: string,
 *    maxKey: number,
 *    inputKeys: number[],
 *    freq: number[],
 *    output: Array<number|null>,
 *    inputFocusIndex?: number | null,
 *    countFocusIndex?: number | null,
 *    outputFocusIndex?: number | null,
 *    formula?: string | null,
 *   },
 *   radixViz?: Record<string, unknown>,
 *   heapViz?: { heapSize: number, done?: boolean },
 *   insertionViz?: {
 *     values: number[],
 *     keyIndex: number | null,
 *     shiftIndices: number[],
 *     arrow: { from: number, to: number } | null, // key slot vs compare/shift lane index (neighbor)
 *   },
 * }} SortStep
 */

/** @param {number[]} arr @param {string} caption @param {Record<number,string>|undefined} highlight @param {Partial<SortStep>} [extra] */
function step(arr, caption, highlight, extra = {}) {
  return {
    caption,
    arr: [...arr],
    highlight: highlight && Object.keys(highlight).length ? { ...highlight } : {},
    ...extra,
  };
}

/** @param {number[]} vals */
function neutralInsertionViz(vals) {
  return {
    values: [...vals],
    keyIndex: null,
    shiftIndices: [],
    arrow: /** @type {null} */ (null),
  };
}

/** @param {number[]} original */
export function insertionSortSteps(original) {
  /** @type {SortStep[]} */
  const steps = [];
  const arr = [...original];
  const n = arr.length;

  steps.push(
    step(
      arr,
      "Insertion sort: extend a sorted prefix left-to-right; each new key walks left past larger neighbors.",
      {},
      { insertionViz: neutralInsertionViz(arr) }
    )
  );

  if (n <= 1) {
    steps.push(
      step(
        arr,
        n === 0 ? "Nothing to sort (empty array)." : "Single element — already sorted.",
        {},
        { insertionViz: neutralInsertionViz(arr) }
      )
    );
    return steps;
  }

  for (let i = 1; i < n; i++) {
    const num = arr[i];
    let j = i - 1;
    if (j < 0 || arr[j] <= num) {
      steps.push(
        step(
          arr,
          `i=${i}: key ${num}. Left neighbor ≤ key — nothing to shift; [0…${i}] already sorted.`,
          { [i]: "pivot" },
          {
            insertionViz: {
              values: [...arr],
              keyIndex: i,
              shiftIndices: [],
              arrow: null,
            },
          }
        )
      );
      continue;
    }

    let probe = i - 1;
    while (probe >= 0 && arr[probe] > num) probe--;
    const insertAt = probe + 1;

    while (j >= 0 && arr[j] > num) {
      const opening = j === i - 1;
      /** Pedagogical “hole”: key travels in slot `j + 1` before this shift writes `arr[j]` into it */
      const hole = j + 1;
      const vis = [...arr];
      vis[hole] = num;
      /** Arrow: key sits in `hole`; this step compares / shifts toward neighbor at `j` (shift lane). */
      const compareArrow =
        hole !== j ? { from: hole, to: j } : /** @type {null} */ (null);
      steps.push(
        step(
          arr,
          opening
            ? `i=${i}: key ${num}. Slide larger elements right until left ≤ key (target insertion index ~[${insertAt}]).`
            : `Shift ${arr[j]} from [${j}] → [${j + 1}] (key ${num} continues left).`,
          opening
            ? { [i]: "highlight", [j]: "highlight" }
            : { [j]: "highlight", [j + 1]: "range" },
          {
            insertionViz: {
              values: vis,
              keyIndex: hole,
              shiftIndices: [j],
              arrow: compareArrow,
            },
          }
        )
      );
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = num;
    steps.push(
      step(
        arr,
        `Insert ${num} at [${j + 1}]. Sorted prefix now covers indices 0…${i}.`,
        { [j + 1]: "pivot" },
        {
          insertionViz: {
            values: [...arr],
            keyIndex: j + 1,
            shiftIndices: [],
            arrow: null,
          },
        }
      )
    );
  }

  steps.push(
    step(
      arr,
      "Done. Worst-case O(n²) shifts; only O(1) extra space.",
      {},
      { insertionViz: neutralInsertionViz(arr) }
    )
  );
  return steps;
}

/** @param {number[]} original */
export function shellSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  const firstDiagramGap = n >= 2 ? Math.floor(n / 2) : null;
  steps.push(
    step(
      arr,
      "Shell sort: insertion sort where compares are spaced by a gap that shrinks (here ⌊n/2⌋, then half, until 1).",
      {},
      firstDiagramGap != null && firstDiagramGap > 0
        ? { shellGap: firstDiagramGap, shellPrevGap: null }
        : {}
    )
  );

  let prevGap = /** @type {number | null} */ (null);
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    const gapMeta = { shellGap: gap, shellPrevGap: prevGap };
    steps.push(
      step(
        arr,
        `Gap ${gap}${prevGap != null ? ` (previous gap was ${prevGap})` : ""}: every subsequence {i, i+${gap}, i+2·${gap}, …} is insertion-sorted.`,
        {},
        gapMeta
      )
    );
    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j = i;
      if (arr[j - gap] <= temp) {
        steps.push(
          step(
            arr,
            `Gap ${gap}: ${temp} at [${i}] — gap-left neighbor is not larger; skip.`,
            { [i]: "pivot" },
            gapMeta
          )
        );
        continue;
      }
      steps.push(
        step(
          arr,
          `Gap ${gap}: treat ${temp} at [${i}] as the key; move left in steps of ${gap} while the slot ${gap} away is larger.`,
          { [i]: "highlight" },
          gapMeta
        )
      );
      while (j >= gap && arr[j - gap] > temp) {
        steps.push(
          step(
            arr,
            `Move value ${arr[j - gap]} from [${j - gap}] down to [${j}].`,
            { [j]: "highlight", [j - gap]: "range" },
            gapMeta
          )
        );
        arr[j] = arr[j - gap];
        j -= gap;
      }
      arr[j] = temp;
      steps.push(step(arr, `Park ${temp} at [${j}].`, { [j]: "pivot" }, gapMeta));
    }
    steps.push(step(arr, `End of gap-${gap} pass.`, {}, gapMeta));
    prevGap = gap;
  }
  steps.push(
    step(
      arr,
      "Shell sort finished.",
      {},
      n >= 2 ? { shellGap: 1, shellPrevGap: null } : {}
    )
  );
  return steps;
}

export function heapSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;

  /** @param {number} heapSize @param {{ done?: boolean }} [opts] */
  const hv = (heapSize, opts) => ({
    heapViz: opts?.done ? { heapSize, done: true } : { heapSize },
  });

  if (!n) {
    steps.push(step(arr, "Nothing to sort (empty input).", {}, hv(0, { done: true })));
    return steps;
  }
  if (n === 1) {
    steps.push(step(arr, "Single element — nothing to order.", {}, hv(1)));
    steps.push(step(arr, "Heap sort complete.", {}, hv(0, { done: true })));
    return steps;
  }

  /** Sift root down in heap of size `size` (indexes 0..size-1). */
  function siftDown(size, root) {
    let idx = root;
    while (true) {
      let largest = idx;
      const l = 2 * idx + 1;
      const r = 2 * idx + 2;
      const leftStr = l < size ? `L=${arr[l]}@[${l}]` : "no left child";
      const rightStr = r < size ? `R=${arr[r]}@[${r}]` : "no right child";
      steps.push(
        step(
          arr,
          `Sift at [${idx}] (max-heap of ${size} nodes). Parent=${arr[idx]}; ${leftStr}; ${rightStr}. Pick larger child to swap with if it beats parent.`,
          {
            [idx]: "pivot",
            ...(l < size ? { [l]: "highlight" } : {}),
            ...(r < size ? { [r]: "highlight" } : {}),
          },
          hv(size)
        )
      );
      if (l < size && arr[l] > arr[largest]) largest = l;
      if (r < size && arr[r] > arr[largest]) largest = r;
      if (largest === idx) break;
      steps.push(
        step(arr, `Child [${largest}]=${arr[largest]} wins — swap with parent [${idx}].`, {
          [idx]: "highlight",
          [largest]: "highlight",
        }, hv(size))
      );
      [arr[idx], arr[largest]] = [arr[largest], arr[idx]];
      idx = largest;
    }
  }

  steps.push(
    step(
      arr,
      "Heap sort: build a max-heap in the prefix, then repeatedly swap the root into the sorted suffix and sift down.",
      {},
      hv(n)
    )
  );
  steps.push(
    step(
      arr,
      "Heapify: starting at the last parent ⌊n/2⌋−1, sift each node down to form a max-heap.",
      {},
      hv(n)
    )
  );
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    siftDown(n, i);
  }
  steps.push(
    step(
      arr,
      "Max-heap ready. Repeatedly: swap root (max) with the last unsorted slot, shrink heap, sift new root down.",
      {},
      hv(n)
    )
  );
  for (let i = n - 1; i > 0; i--) {
    steps.push(
      step(
        arr,
        `Extract max: swap [0] with [${i}] (sorted region grows at the right).`,
        {
          0: "highlight",
          [i]: "range",
        },
        hv(i + 1)
      )
    );
    [arr[0], arr[i]] = [arr[i], arr[0]];
    siftDown(i, 0);
  }
  steps.push(step(arr, "Heap sort complete.", {}, hv(0, { done: true })));
  return steps;
}

/** @param {() => Record<string, unknown>} [getMergeMeta] @param {() => void} [syncRevealBeforeSteps] */
function mergeWork(arr, left, mid, right, steps, getMergeMeta, syncRevealBeforeSteps) {
  const extra = getMergeMeta ?? (() => ({}));
  syncRevealBeforeSteps?.();
  const n1 = mid - left + 1;
  const n2 = right - mid;
  const L = arr.slice(left, mid + 1);
  const R = arr.slice(mid + 1, right + 1);
  steps.push(
    step(
      arr,
      `Merge A[${left}…${right}]: auxiliary L=[${L.join(", ")}], R=[${R.join(", ")}] — refill that span by two-pointer compares (stable).`,
      rangeHighlight(left, right),
      extra()
    )
  );
  let i = 0,
    j = 0,
    k = left;
  while (i < n1 && j < n2) {
    if (L[i] <= R[j]) arr[k++] = L[i++];
    else arr[k++] = R[j++];
  }
  while (i < n1) arr[k++] = L[i++];
  while (j < n2) arr[k++] = R[j++];
}

function rangeHighlight(a, b) {
  /** @type {Record<number,string>} */
  const h = {};
  for (let i = a; i <= b; i++) h[i] = "range";
  return h;
}

export function mergeSortSteps(original) {
  /** @type {SortStep[]} */
  const steps = [];
  const arr = [...original];
  const phases = computeMergeDiagramPhases(original).phases;

  /** exclusive end index: show phases[0 … mergeRevealExclusive−1]; grows with splits & completed merges */
  let revealExclusive = phases.length ? 1 : 0;

  /** @returns {Partial<SortStep>} */
  const mm =
    phases.length > 0
      ? () => ({
          mergeDiagramPhases: phases,
          mergeRevealExclusive: revealExclusive,
        })
      : () => ({});

  const firstConquerIdx = phases.findIndex((p) => p.phase === "merge" || p.phase === "sorted");

  if (!arr.length) {
    steps.push(step(arr, "Nothing to sort (empty input)."));
    return steps;
  }

  if (arr.length === 1) {
    revealExclusive = 1;
    steps.push(
      step(
        arr,
        "Merge sort: split the range, recurse on halves, merge two sorted runs back together.",
        {},
        mm()
      )
    );
    revealExclusive = Math.max(phases.length, 1);
    steps.push(step(arr, "Only one element — already sorted.", {}, mm()));
    return steps;
  }

  steps.push(
    step(arr, "Merge sort: split the range, recurse on halves, merge two sorted runs back together.", {}, mm())
  );

  let completedMerges = 0;

  const divideRevealCap = Math.max(1, firstConquerIdx >= 0 ? firstConquerIdx : phases.length);

  /** Keep conquer-phase rows visible during merge() micro-steps (reveal otherwise lags completedMerges). */
  const syncRevealForMergeWork = () => {
    if (!phases.length || firstConquerIdx < 0) return;
    revealExclusive = Math.min(
      Math.max(revealExclusive, firstConquerIdx + completedMerges + 1),
      phases.length
    );
  };

  function ms(left, right) {
    if (left >= right) return;
    const mid = left + Math.floor((right - left) / 2);
    /* Only grow the divide ladder while it is not full; never shrink reveal on later splits (e.g. right subtree). */
    if (revealExclusive < divideRevealCap) {
      revealExclusive += 1;
    }
    steps.push(
      step(
        arr,
        `Split [${left}…${right}] into [${left}…${mid}] and [${mid + 1}…${right}]. Recurse on each half.`,
        rangeHighlight(left, right),
        mm()
      )
    );
    ms(left, mid);
    ms(mid + 1, right);
    mergeWork(arr, left, mid, right, steps, mm, syncRevealForMergeWork);
    completedMerges += 1;
    revealExclusive = Math.min(firstConquerIdx + completedMerges, phases.length);
    const span = arr.slice(left, right + 1);
    steps.push(
      step(
        arr,
        `Range [${left}…${right}] merged and sorted → [${span.join(", ")}].`,
        rangeHighlight(left, right),
        mm()
      )
    );
  }
  ms(0, arr.length - 1);
  revealExclusive = phases.length;
  steps.push(step(arr, "All levels merged — sort complete.", {}, mm()));
  return steps;
}

export function countSortSteps(original) {
  /** @type {SortStep[]} */
  const steps = [];
  const baseline = [...original];
  let arr = [...original];
  const n = arr.length;
  if (!n) {
    steps.push(step(arr, "Nothing to sort (empty input)."));
    return steps;
  }

  let maxval = 0;
  for (let i = 0; i < n; i++) maxval = Math.max(maxval, arr[i]);
  const m = maxval + 1;

  /** @returns {Partial<SortStep>} */
  const viz = /** @returns {Partial<SortStep>} */ (partial) => ({
    countingViz: {
      phase: partial.phase ?? "generic",
      maxKey: partial.maxKey ?? maxval,
      inputKeys:
        partial.inputKeys && partial.inputKeys.length ? [...partial.inputKeys] : [...baseline],
      freq: partial.freq != null ? [...partial.freq] : [...Array(m).fill(0)],
      output:
        partial.output != null
          ? [...partial.output]
          : Array.from({ length: n }, () => /** @type {number|null} */ (null)),
      inputFocusIndex:
        typeof partial.inputFocusIndex === "number" ? partial.inputFocusIndex : undefined,
      countFocusIndex: typeof partial.countFocusIndex === "number" ? partial.countFocusIndex : undefined,
      outputFocusIndex:
        typeof partial.outputFocusIndex === "number" ? partial.outputFocusIndex : undefined,
      formula:
        typeof partial.formula === "string" ? partial.formula : undefined,
    },
  });

  steps.push(
    step(
      arr,
      `Counting sort: keys in 0…${maxval}. Pass 1 — tally how many of each value (frequency table, length ${m}).`,
      rangeHighlight(0, n - 1),
      viz({
        phase: "intro",
        freq: Array(m).fill(0),
        output: Array.from({ length: n }, () => null),
        formula: undefined,
      })
    )
  );

  const fr = new Array(m).fill(0);
  for (let i = 0; i < n; i++) fr[arr[i]]++;
  const tallyPreview = [];
  for (let v = 0; v <= maxval; v++) if (fr[v]) tallyPreview.push(`${v}→${fr[v]}`);

  steps.push(
    step(
      arr,
      `Frequencies (before prefix): ${tallyPreview.slice(0, 32).join(", ")}${tallyPreview.length > 32 ? ", …" : ""}. Next: prefix-sum into cumulative positions.`,
      {},
      viz({
        phase: "freq",
        freq: [...fr],
        output: Array.from({ length: n }, () => null),
        formula: undefined,
      })
    )
  );

  for (let i = 1; i <= maxval; i++) {
    fr[i] += fr[i - 1];
  }

  steps.push(
    step(
      arr,
      `Cumulative count array (prefix sums): each slot v holds how many keys are ≤ v — this gives the last output index for value v.`,
      {},
      viz({
        phase: "cum",
        freq: [...fr],
        output: Array.from({ length: n }, () => null),
        formula: undefined,
      })
    )
  );

  steps.push(
    step(
      arr,
      `Pass 3 — walk i = n−1 … 0. For arr[i]=v, write to output[count[v] − 1], then decrement count[v] (stable, right-to-left).`,
      {},
      viz({
        phase: "scatterIntro",
        freq: [...fr],
        output: Array.from({ length: n }, () => null),
        formula: undefined,
      })
    )
  );

  const sorted = Array.from({ length: n }, () => /** @type {number|null} */ (null));
  const frWorking = [...fr];

  for (let i = n - 1; i >= 0; i--) {
    const stepNum = n - i;
    const v = arr[i];
    const freqBeforeWrite = [...frWorking];
    const cBefore = freqBeforeWrite[v];
    const pos = cBefore - 1;
    const formula = `${cBefore} − 1 = ${pos}`;
    sorted[pos] = v;
    frWorking[v]--;

    steps.push(
      step(
        arr,
        `Scatter ${stepNum} / ${n}: arr[${i}] = ${v}. Cumulative count[${v}] = ${cBefore} ⇒ output slot ${pos} (${formula}); then decrement count[${v}].`,
        { [i]: "highlight" },
        viz({
          phase: "scatter",
          freq: freqBeforeWrite,
          output: [...sorted],
          inputFocusIndex: i,
          countFocusIndex: v,
          outputFocusIndex: pos,
          formula,
        })
      )
    );
  }

  for (let j = 0; j < n; j++) arr[j] = /** @type {number} */ (sorted[j]);

  steps.push(
    step(
      arr,
      `Done — counting sort finished (time O(n + m), space O(n + m) with m = max key + 1).`,
      {},
      viz({
        phase: "done",
        freq: [...frWorking],
        output: sorted.map((x) => /** @type {number} */ (x)),
        formula: undefined,
      })
    )
  );

  return steps;
}

/** In-place one radix digit pass (stable counting sort on digit at scale). Lab parity. */
function radixStableDigitPassInPlace(arr, scale) {
  const n = arr.length;
  const output = new Array(n);
  const frq = new Array(10).fill(0);
  for (let i = 0; i < n; i++) {
    frq[Math.floor(arr[i] / scale) % 10]++;
  }
  for (let i = 1; i < 10; i++) {
    frq[i] += frq[i - 1];
  }
  for (let i = n - 1; i >= 0; i--) {
    const d = Math.floor(arr[i] / scale) % 10;
    output[frq[d] - 1] = arr[i];
    frq[d]--;
  }
  for (let i = 0; i < n; i++) {
    arr[i] = output[i];
  }
}

function radixPlaceLabel(scale) {
  switch (scale) {
    case 1:
      return "ones";
    case 10:
      return "tens";
    case 100:
      return "hundreds";
    case 1000:
      return "thousands";
    default:
      return `place ${scale}`;
  }
}

/** @param {number[]} slice */
function radixBuildBucketsStableLR(slice, scale) {
  /** @type {number[][]} */
  const buckets = Array.from({ length: 10 }, () => []);
  for (let i = 0; i < slice.length; i++) {
    const v = slice[i];
    const d = Math.floor(Math.abs(v) / scale) % 10;
    buckets[d].push(v);
  }
  return buckets;
}

export function radixSortSteps(original) {
  /** @type {SortStep[]} */
  const steps = [];
  let arr = [...original];
  const n = arr.length;

  /** @returns {Partial<SortStep>} */
  const rv = (partial) =>
    ({
      radixViz: {
        phase: partial.phase ?? "radix",
        keys: partial.keys != null ? [...partial.keys] : [],
        underlineScale:
          typeof partial.underlineScale === "number"
            ? partial.underlineScale
            : partial.underlineScale === null
              ? null
              : undefined,
        buckets: partial.buckets != null ? partial.buckets.map((b) => [...b]) : Array.from({ length: 10 }, () => []),
        listAfter: partial.listAfter != null ? [...partial.listAfter] : null,
        placeLabel: String(partial.placeLabel ?? ""),
        scale: typeof partial.scale === "number" ? partial.scale : 1,
        maxKeyDigits: typeof partial.maxKeyDigits === "number" ? partial.maxKeyDigits : 1,
      },
    });

  if (!n) {
    steps.push(step(arr, "Nothing to sort (empty input)."));
    return steps;
  }

  let maxN = arr[0];
  for (let i = 1; i < n; i++) if (arr[i] > maxN) maxN = arr[i];

  const maxDigits = Math.max(...arr.map((x) => String(Math.abs(Math.trunc(Number(x)) || 0)).length || 1), 1);

  /** @type {number[]} */
  const scales = [];
  for (let s = 1; s <= Math.max(maxN, 1); s *= 10) {
    scales.push(s);
    if (s > Math.max(maxN, 1) * 10) break;
    if (s > 1e15) break;
  }

  /** @returns {number[][]} */
  const emptyBuckets = () => Array.from({ length: 10 }, () => /** @type {number[]} */ ([]));

  const totalPasses = scales.length;

  steps.push(
    step(
      arr,
      `Radix LSD base-10, max=${maxN}: ${totalPasses} stable counting-sort passes (place values ${scales.join(", ")}). Numbers enqueue left→right into queues by digit (infographic row).`,
      {},
      rv({
        phase: "radixIntro",
        keys: [...arr],
        underlineScale: undefined,
        buckets: emptyBuckets(),
        listAfter: null,
        placeLabel: "—",
        scale: scales[0] ?? 1,
        maxKeyDigits: maxDigits,
      })
    )
  );

  let pi = 0;
  for (const scale of scales) {
    pi++;
    const before = [...arr];
    const lbl = radixPlaceLabel(scale);

    steps.push(
      step(
        arr,
        `Pass ${pi}/${totalPasses} (${lbl}): underline that digit column, enqueue each key left→right into Queue-0…9.`,
        {},
        rv({
          phase: "passPrep",
          keys: before,
          underlineScale: scale,
          buckets: emptyBuckets(),
          listAfter: null,
          placeLabel: lbl,
          scale,
          maxKeyDigits: maxDigits,
        })
      )
    );

    const buckets = radixBuildBucketsStableLR(before, scale);
    radixStableDigitPassInPlace(arr, scale);

    steps.push(
      step(
        arr,
        `Pass ${pi}: read queues 0→9 — order is [${buckets.flatMap((b) => b).join(", ")}] (matches stable counting-sort refill of A[])`,
        {},
        rv({
          phase: "bucketsFilled",
          keys: before,
          underlineScale: scale,
          buckets,
          listAfter: [...arr],
          placeLabel: lbl,
          scale,
          maxKeyDigits: maxDigits,
        })
      )
    );
  }

  steps.push(
    step(
      arr,
      `Radix complete — all digits processed.`,
      {},
      rv({
        phase: "radixDone",
        keys: [...arr],
        underlineScale: undefined,
        buckets: emptyBuckets(),
        listAfter: [...arr],
        placeLabel: "sorted",
        scale: scales[scales.length - 1] ?? 1,
        maxKeyDigits: maxDigits,
      })
    )
  );

  return steps;
}

/** Fallback when a panel does not supply its own starter list. */
export const DEMO_ARRAY = [43, 7, 19, 2, 31, 4, 12, 8];

/** Starter lists tuned per algorithm narrative (~8 ints; Shell uses 9; counting uses small non-negative keys only). */
export const DEMO_ARRAY_INSERTION = [41, 8, 15, 3, 38, 2, 19, 5]; // Keys travel left through a growing prefix (shifts/exchanges).
export const DEMO_ARRAY_SHELL = [82, 5, 61, 3, 29, 7, 14, 1, 47]; // +1 elt: distant gap moves still evident before gap-1 polish (n=9).
export const DEMO_ARRAY_HEAP = [21, 4, 17, 3, 9, 1, 14, 6]; // Builds a clear max-heap then extract-max/sift-down stripes.
export const DEMO_ARRAY_MERGE = [38, 27, 43, 3, 9, 82, 10, 56]; // Classic 8-element divide/conquer pairing (diagram-friendly).
export const DEMO_ARRAY_COUNT = [5, 0, 3, 3, 1, 2, 8, 1]; // Tight [0..8] range plus duplicates so frequency + stable scatter are clear.
export const DEMO_ARRAY_RADIX = [170, 45, 75, 90, 802, 24, 2, 66]; // Multi-width keys: LSD passes for ones, tens, hundreds (classic example).
