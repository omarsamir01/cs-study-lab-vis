/**
 * Builds step arrays for sorting visualizers.
 * Matches logic from Lab_8_task.cpp
 */

/** @typedef {{ caption: string, arr: number[], highlight?: Record<number,string> }} SortStep */

/** @param {number[]} arr @param {string} caption @param {Record<number,string>|undefined} highlight */
function step(arr, caption, highlight) {
  return {
    caption,
    arr: [...arr],
    highlight: highlight ? { ...highlight } : {},
  };
}

/** @param {number[]} original */
export function insertionSortSteps(original) {
  /** @type {SortStep[]} */
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  steps.push(step(arr, "Start: insertion sort grows a sorted prefix; each new card shifts left until it fits (Lab insertion sort)."));

  for (let i = 1; i < n; i++) {
    const num = arr[i];
    steps.push(
      step(
        arr,
        `Pick element at index ${i} (value ${num}) to insert into the sorted region [0..${i - 1}].`,
        { [i]: "highlight" }
      )
    );
    let j = i - 1;
    while (j >= 0 && arr[j] > num) {
      steps.push(
        step(
          arr,
          `Compare ${num} with arr[${j}] = ${arr[j]}. Since ${arr[j]} > ${num}, shift ${arr[j]} right.`,
          { [j]: "highlight", [j + 1]: "range" }
        )
      );
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = num;
    steps.push(
      step(
        arr,
        `Placed ${num} at index ${j + 1}. Sorted prefix is now [0..${i}].`,
        { [j + 1]: "pivot" }
      )
    );
  }
  steps.push(step(arr, "Done: O(n²) comparisons/shifts worst case; in-place O(1) extra space."));
  return steps;
}

/** @param {number[]} original */
export function shellSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  steps.push(
    step(
      arr,
      "Shell sort: generalized insertion sort with gap sequence (here gap starts at ⌊n/2⌋ and halves, per your lab)."
    )
  );

  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    steps.push(step(arr, `New gap = ${gap}. Sorting interleaved subsequences spaced by ${gap}.`));
    for (let i = gap; i < n; i++) {
      let temp = arr[i];
      let j = i;
      steps.push(
        step(arr, `Insert arr[${i}] = ${temp} into its gap-${gap} subsequence.`, {
          [i]: "highlight",
        })
      );
      while (j >= gap && arr[j - gap] > temp) {
        steps.push(
          step(arr, `${arr[j - gap]} at j-${gap} is greater than ${temp}; slide it forward by gap.`, {
            [j]: "highlight",
            [j - gap]: "range",
          })
        );
        arr[j] = arr[j - gap];
        j -= gap;
      }
      arr[j] = temp;
    }
    steps.push(step(arr, `Finished pass for gap ${gap}. Partial order tighter.`));
  }
  steps.push(step(arr, "Shell sort complete. Complexity depends on gap sequence."));
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
      steps.push(
        step(arr, `Sift-down at index ${idx} (heap size ${size}). Compare with children.`, {
          [idx]: "pivot",
          ...(l < size ? { [l]: "highlight" } : {}),
          ...(r < size ? { [r]: "highlight" } : {}),
        })
      );
      if (l < size && arr[l] > arr[largest]) largest = l;
      if (r < size && arr[r] > arr[largest]) largest = r;
      if (largest === idx) break;
      steps.push(
        step(arr, `Swap parent ${arr[idx]} ↔ child ${arr[largest]} (${largest}).`, {
          [idx]: "highlight",
          [largest]: "highlight",
        })
      );
      [arr[idx], arr[largest]] = [arr[largest], arr[idx]];
      idx = largest;
    }
  }

  steps.push(
    step(arr, "Build max-heap: sift down each non-leaf from ⌊n/2⌋−1 … 0 (Lab heap sort heapify).")
  );
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    steps.push(step(arr, `Build phase: sift down subtree rooted at ${i}.`));
    siftDown(n, i);
    steps.push(step(arr, `Heap property strengthened at root ${i}.`));
  }
  steps.push(step(arr, "Max-heap built. Extract-max: swap root with last element, sift down."));
  for (let i = n - 1; i > 0; i--) {
    steps.push(
      step(arr, `Swap max at root with arr[${i}]; sorted tail starts at ${i}.`, {
        0: "highlight",
        [i]: "range",
      })
    );
    [arr[0], arr[i]] = [arr[i], arr[0]];
    siftDown(i, 0);
  }
  steps.push(step(arr, "Heap sort done: O(n log n); Lab notes O(log n) stack for recursive heapify in C++."));
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
      `Merge indices [${left},${mid}] with [${mid + 1},${right}]: copy to temp L and R.`,
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
        `Merge: compare L[${i}]=${L[i]} vs R[${j}]=${R[j]} — take ${takeLeft ? `L → ${L[i]}` : `R → ${R[j]}`}.`,
        { [k]: "highlight" }
      )
    );
    if (takeLeft) arr[k++] = L[i++];
    else arr[k++] = R[j++];
  }
  while (i < n1) {
    steps.push(step(arr, `Flush rest of L at k=${k}.`, { [k]: "range" }));
    arr[k++] = L[i++];
  }
  while (j < n2) {
    steps.push(step(arr, `Flush rest of R at k=${k}.`, { [k]: "range" }));
    arr[k++] = R[j++];
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
  steps.push(step(arr, "Merge sort: divide range, sort halves, merge sorted runs (Lab merge sort)."));

  function ms(left, right) {
    if (left >= right) return;
    const mid = left + Math.floor((right - left) / 2);
    steps.push(
      step(arr, `Divide [${left},${right}] at mid=${mid}.`, rangeHighlight(left, right))
    );
    ms(left, mid);
    ms(mid + 1, right);
    mergeWork(arr, left, mid, right, steps);
    steps.push(step(arr, `Merged [${left},${right}] is sorted.`, rangeHighlight(left, right)));
  }
  ms(0, arr.length - 1);
  steps.push(step(arr, "Complete: O(n log n) time, O(n) auxiliary for merges."));
  return steps;
}

export function countSortSteps(original) {
  const steps = [];
  const arr = [...original];
  const n = arr.length;
  let maxval = 0;
  for (let i = 0; i < n; i++) maxval = Math.max(maxval, arr[i]);
  steps.push(
    step(arr, `Counting sort: max value ${maxval}. Build frequency array of length ${maxval + 1}.`)
  );
  const fr = new Array(maxval + 1).fill(0);
  for (let i = 0; i < n; i++) {
    fr[arr[i]]++;
    steps.push(
      step(arr, `Count++ for value ${arr[i]}`, { [i]: "highlight" })
    );
  }
  steps.push(
    step(arr, `Frequency built: [${fr.slice(0, Math.min(fr.length, 20)).join(",")}${fr.length > 20 ? "…" : ""}]`)
  );
  for (let i = 1; i <= maxval; i++) {
    fr[i] += fr[i - 1];
  }
  steps.push(step(arr, "Prefix sums: fr[i] = last index where value i appears in output."));
  const sorted = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    const v = arr[i];
    const pos = fr[v] - 1;
    sorted[pos] = v;
    fr[v]--;
    steps.push(
      step(arr, `Place ${v} from end of input into output index ${pos} (stable backwards walk).`, { [i]: "highlight" })
    );
  }
  for (let i = 0; i < n; i++) arr[i] = sorted[i];
  steps.push(step(arr, "Done counting sort O(n+m) when range m is modest."));
  return steps;
}

function countDigit(arr, scale, steps) {
  const n = arr.length;
  const output = new Array(n);
  const frq = new Array(10).fill(0);
  steps.push(step(arr, `Radix digit pass: scale=${scale}, bucket by (value/scale)%10.`));
  for (let i = 0; i < n; i++) frq[Math.floor(arr[i] / scale) % 10]++;
  for (let i = 1; i < 10; i++) frq[i] += frq[i - 1];
  for (let i = n - 1; i >= 0; i--) {
    const d = Math.floor(arr[i] / scale) % 10;
    output[frq[d] - 1] = arr[i];
    frq[d]--;
  }
  for (let i = 0; i < n; i++) arr[i] = output[i];
  steps.push(step(arr, `After stable count sort on digit (${scale}s place).`));
}

export function radixSortSteps(original) {
  const steps = [];
  const arr = [...original];
  let maxN = arr[0];
  for (let i = 1; i < arr.length; i++) if (arr[i] > maxN) maxN = arr[i];
  steps.push(step(arr, `Radix sort LSD base-10: max=${maxN}. Each pass is a counting sort on one digit.`));
  for (let scale = 1; Math.floor(maxN / scale) > 0; scale *= 10) {
    countDigit(arr, scale, steps);
  }
  steps.push(step(arr, "Radix complete: O(d·(n+k)) with d digits, k=10."));
  return steps;
}

export const DEMO_ARRAY = [170, 45, 75, 90, 802, 24, 2, 66];
