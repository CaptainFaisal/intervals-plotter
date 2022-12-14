const heapify = (heap, i, size, key1 = (e) => e, key2 = (e) => e) => {
  let largest = i;
  const l = 2 * i + 1;
  const r = 2 * i + 2;
  if (l < size && key1(heap[l]) < key1(heap[largest])) largest = l;
  if (r < size && key1(heap[r]) < key1(heap[largest])) largest = r;
  if (
    l < size &&
    key1(heap[l]) == key1(heap[largest]) &&
    key2(heap[l]) > key2(heap[largest])
  )
    largest = l;
  if (
    r < size &&
    key1(heap[r]) == key1(heap[largest]) &&
    key2(heap[r]) > key2(heap[largest])
  )
    largest = r;

  if (largest != i) {
    const temp = heap[largest];
    heap[largest] = heap[i];
    heap[i] = temp;
    heapify(heap, largest, size, key1, key2);
  }
};
const swim = (heap, i, key1 = (e) => e, key2 = (e) => e) => {
  const parent = Math.ceil(i / 2) - 1;
  if (
    (parent >= 0 && key1(heap[i]) < key1(heap[parent])) ||
    (parent >= 0 &&
      key1(heap[i]) == key1(heap[parent]) &&
      key2(heap[i]) > key2(heap[parent]))
  ) {
    const temp = heap[parent];
    heap[parent] = heap[i];
    heap[i] = temp;
    swim(heap, parent, key1, key2);
  }
};
const schedule = (intervals) => {
  const tempIntervals = intervals.slice(0);
  tempIntervals.sort((a, b) => b.end - a.end);
  const maxEnd = tempIntervals[0].end; //needed for width of the canvas             structure of heap
  s = intervals.slice(0);
  s.sort((a, b) => b.start - a.start); //O(nlogn)      //      worker1             worker2            worker3
  for(const t of s) console.log(t)
  const heap = [];                                     //[  [{}, {}, ...]   ,   [{}, {}, ...],     [{}, {}, ...]    , ...]
  while (s.length > 0) {
                                                       // {} = {"start":s, "end": e}
    const task = s.pop(); //task with smallest start time
    if (!heap.length) heap.push([task]); //[ [{}] ]
    else {
      if (
        heap[0][heap[0].length - 1].end <= task.start
      ) {
        heap[0].push(task);
        heapify(
          heap,
          0,
          heap.length,
          (e) => e[e.length - 1].end,
          (e) => e.length
        ); //O(logn)
      } else {
        heap.push([task]);
        swim(
          heap,
          heap.length - 1,
          (e) => e[e.length - 1].end,
          (e) => e.length
        ); //O(logn)
      }
    }
  }
  return [heap, maxEnd];
};
const conflictCount = (scheduled, task) => {
  const conflicts = []; // [[{}, {}, ...], [{}, ...]]
  for (let idx = 0; idx < scheduled.length; idx++) {
    for (let i = 0; i < scheduled[idx].length; i++) {
      if (
        scheduled[idx][i].end > task.start &&
        task.end > scheduled[idx][i].start
      ) {
        if (conflicts[idx]) conflicts[idx].push(scheduled[idx][i]);
        else conflicts[idx] = [scheduled[idx][i]];
      }
    }
  }
  return conflicts;
};
