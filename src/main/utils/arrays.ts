/**
 * Returns the new array that contains unique elements, or returns `arr` itself if it only contains unique elements.
 */
export function uniqueArray<T>(arr: T[]): T[];

/**
 * Returns the new array that contains unique elements, or returns `arr` itself if it only contains unique elements.
 */
export function uniqueArray<T>(arr: readonly T[]): readonly T[];

export function uniqueArray<T>(arr: readonly T[]): readonly T[] {
  let uniqueArr: T[] | null = null;

  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];

    if (arr.includes(value, i + 1)) {
      if (uniqueArr === null) {
        uniqueArr = arr.slice(0, i);
      }
      continue;
    }
    if (uniqueArr !== null) {
      uniqueArr.push(value);
    }
  }
  return uniqueArr || arr;
}

/**
 * Mutates the array!
 *
 * Removes an element at index from an array.
 *
 * @param arr The array to modify.
 * @param index The index in the array.
 */
export function deleteArrayIndex<T>(arr: T[], index: number): T[] {
  if (index >= 0) {
    for (let i = index + 1; i < arr.length; ++i) {
      arr[i - 1] = arr[i];
    }
    arr.pop();
  }
  return arr;
}

/**
 * Converts `k` to a number if it represents a valid array index, or returns -1 if `k` isn't an index.
 */
export function toArrayIndex(k: any): number {
  return (typeof k === 'number' || (typeof k === 'string' && k === '' + (k = +k))) && k >>> 0 === k ? k : -1;
}
