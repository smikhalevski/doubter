/**
 * Returns the new array that contains unique elements.
 */
export function toUniqueArray<T>(arr: readonly T[]): T[] {
  let uniqueArr: T[] = [];

  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];

    if (!uniqueArr.includes(value)) {
      uniqueArr.push(value);
    }
  }
  return uniqueArr;
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
