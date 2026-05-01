/**
 * Builds step arrays for sorting visualizers.
 * Matches logic from Lab_8_task.cpp
 */

/**
 * @typedef {{
 *   caption: string,
 *   arr: number[],
 *   highlight?: Record<number,string>,
 *   radixScale?: number,
 *   radixShowDigitStrip?: boolean,
 *   shellGap?: number,
 *   shellPrevGap?: number | null,
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

/** @param {number[]} original */
export function insertionSortSteps(original) {
  /** @type {SortStep[]} */
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  steps.push(
    step(arr, "Insertion sort: extend a sorted prefix left-to-right; each new key walks left past larger neighbors.")
  );

  for (let i = 1; i < n; i++) {
    const num = arr[i];
    let j = i - 1;
    if (j < 0 || arr[j] <= num) {
      steps.push(
        step(
          arr,
          `i=${i}: key ${num}. Left neighbor ≤ key — nothing to shift; [0..${i}] already sorted.`,
          { [i]: "pivot" }
        )
      );
      continue;
    }
    steps.push(step(arr, `i=${i}: key ${num}. Slide larger elements one step right until a smaller (or start) is found.`, { [i]: "highlight" }));
    while (j >= 0 && arr[j] > num) {
      steps.push(
        step(
          arr,
          `Shift ${arr[j]} from [${j}] → [${j + 1}] (key ${num} continues left).`,
          { [j]: "highlight", [j + 1]: "range" }
        )
      );
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = num;
    steps.push(
      step(arr, `Insert ${num} at [${j + 1}]. Sorted prefix is now indices 0…${i}.`, { [j + 1]: "pivot" })
    );
  }
  steps.push(step(arr, "Done. Worst-case O(n²) shifts; only O(1) extra space."));
  return steps;
}

/** @param {number[]} original */
export function shellSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  steps.push(step(arr, "Shell sort: insertion sort where compares are spaced by a gap that shrinks (here ⌊n/2⌋, then half, until 1)."));

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
  steps.push(step(arr, "Shell sort finished."));
  return steps;
}

export function heapSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;

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
          }
        )
      );
      if (l < size && arr[l] > arr[largest]) largest = l;
      if (r < size && arr[r] > arr[largest]) largest = r;
      if (largest === idx) break;
      steps.push(
        step(arr, `Child [${largest}]=${arr[largest]} wins — swap with parent [${idx}].`, {
          [idx]: "highlight",
          [largest]: "highlight",
        })
      );
      [arr[idx], arr[largest]] = [arr[largest], arr[idx]];
      idx = largest;
    }
  }

  steps.push(
    step(arr, "Heapify: starting at the last parent ⌊n/2⌋−1, sift each node down to form a max-heap.")
  );
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    siftDown(n, i);
  }
  steps.push(step(arr, "Max-heap ready. Repeatedly: swap root (max) with the last unsorted slot, shrink heap, sift new root down."));
  for (let i = n - 1; i > 0; i--) {
    steps.push(
      step(arr, `Extract max: swap [0] with [${i}] (sorted region grows at the right).`, {
        0: "highlight",
        [i]: "range",
      })
    );
    [arr[0], arr[i]] = [arr[i], arr[0]];
    siftDown(i, 0);
  }
  steps.push(step(arr, "Heap sort complete."));
  return steps;
}

function mergeWork(arr, left, mid, right, steps) {
  const n1 = mid - left + 1;
  const n2 = right - mid;
  const L = arr.slice(left, mid + 1);
  const R = arr.slice(mid + 1, right + 1);
  steps.push(
    step(
      arr,
      `Merge: copy A[${left}…${mid}] → L and A[${mid + 1}…${right}] → R, then refill A[${left}…${right}] in order.`,
      rangeHighlight(left, right)
    )
  );
  let i = 0,
    j = 0,
    k = left;
  while (i < n1 && j < n2) {
    const takeLeft = L[i] <= R[j];
    steps.push(
      step(
        arr,
        `At output [${k}]: smaller front is ${takeLeft ? `L (${L[i]})` : `R (${R[j]})`} ${takeLeft ? "≤" : "<"} ${takeLeft ? `R (${R[j]})` : `L (${L[i]})`} → write ${takeLeft ? L[i] : R[j]}.`,
        { [k]: "highlight" }
      )
    );
    if (takeLeft) arr[k++] = L[i++];
    else arr[k++] = R[j++];
  }
  if (i < n1) {
    steps.push(
      step(arr, `Left run still has values — copy tail L[${i}..${n1 - 1}] into A in one streak (already ordered).`, {
        [k]: "range",
      })
    );
    while (i < n1) arr[k++] = L[i++];
  }
  if (j < n2) {
    steps.push(
      step(arr, `Right run still has values — copy tail R[${j}..${n2 - 1}] similarly.`, { [k]: "range" })
    );
    while (j < n2) arr[k++] = R[j++];
  }
}

function rangeHighlight(a, b) {
  /** @type {Record<number,string>} */
  const h = {};
  for (let i = a; i <= b; i++) h[i] = "range";
  return h;
}

export function mergeSortSteps(original) {
  const steps = [];
  const arr = [...original];
  steps.push(step(arr, "Merge sort: split the range, recurse on halves, merge two sorted runs back together."));

  function ms(left, right) {
    if (left >= right) return;
    const mid = left + Math.floor((right - left) / 2);
    steps.push(
      step(
        arr,
        `Split [${left}…${right}] into [${left}…${mid}] and [${mid + 1}…${right}]. Recurse on each half.`,
        rangeHighlight(left, right)
      )
    );
    ms(left, mid);
    ms(mid + 1, right);
    mergeWork(arr, left, mid, right, steps);
    steps.push(step(arr, `Range [${left}…${right}] is fully merged and sorted.`, rangeHighlight(left, right)));
  }
  ms(0, arr.length - 1);
  steps.push(step(arr, "All levels merged — sort complete."));
  return steps;
}

export function countSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  let maxval = 0;
  for (let i = 0; i < n; i++) maxval = Math.max(maxval, arr[i]);
  steps.push(
    step(
      arr,
      `Counting sort on values 0…${maxval}. Pass 1: scan the array once and tally how many of each key (frequency).`,
      rangeHighlight(0, n - 1)
    )
  );
  const fr = new Array(maxval + 1).fill(0);
  for (let i = 0; i < n; i++) fr[arr[i]]++;
  const tallyPreview = [];
  for (let v = 0; v <= maxval; v++) if (fr[v]) tallyPreview.push(`${v}→${fr[v]}`);
  steps.push(
    step(
      arr,
      `Counts: ${tallyPreview.slice(0, 24).join(", ")}${tallyPreview.length > 24 ? ", …" : ""}. Next: prefix-sum so each bucket knows its last output slot.`,
      {}
    )
  );
  for (let i = 1; i <= maxval; i++) {
    fr[i] += fr[i - 1];
  }
  steps.push(
    step(
      arr,
      `Pass 3: walk i = n−1 … 0 (backwards keeps stability). Each arr[i] is placed at fr[value]−1, then that count is decremented.`,
      rangeHighlight(0, n - 1)
    )
  );
  const sorted = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    const v = arr[i];
    const pos = fr[v] - 1;
    sorted[pos] = v;
    fr[v]--;
  }
  for (let i = 0; i < n; i++) arr[i] = sorted[i];
  steps.push(step(arr, "Keys scattered into sorted order — counting sort done (O(n + m) time, m = value range)."));
  return steps;
}

function countDigit(arr, scale, steps) {
  const n = arr.length;
  const output = new Array(n);
  const frq = new Array(10).fill(0);
  for (let i = 0; i < n; i++) frq[Math.floor(arr[i] / scale) % 10]++;
  for (let i = 1; i < 10; i++) frq[i] += frq[i - 1];
  for (let i = n - 1; i >= 0; i--) {
    const d = Math.floor(arr[i] / scale) % 10;
    output[frq[d] - 1] = arr[i];
    frq[d]--;
  }
  for (let i = 0; i < n; i++) arr[i] = output[i];
  steps.push(
    step(
      arr,
      `Digit pass (place value ${scale}): stable counting sort on (value ÷ ${scale}) mod 10. Row under bars shows that digit per index.`,
      undefined,
      {
        radixScale: scale,
        radixShowDigitStrip: true,
      }
    )
  );
}

export function radixSortSteps(original) {
  const steps = [];
  const arr = [...original];
  let maxN = arr[0];
  for (let i = 1; i < arr.length; i++) if (arr[i] > maxN) maxN = arr[i];
  steps.push(
    step(arr, `Radix LSD base-10, max=${maxN}. One stable digit pass per decimal place (ones, tens, …).`)
  );
  for (let scale = 1; Math.floor(maxN / scale) > 0; scale *= 10) {
    countDigit(arr, scale, steps);
  }
  steps.push(step(arr, "Radix complete (d passes, k=10 buckets per pass)."));
  return steps;
}

export const DEMO_ARRAY = [170, 45, 75, 90, 802, 24, 2, 66];
