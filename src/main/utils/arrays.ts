/**
 * Array predicate that filters unique elements.
 */
export function unique<T>(value: T, index: number, arr: readonly T[]): boolean {
  return !arr.includes(value, index + 1);
}

/**
 * Removes an element at index from an array.
 *
 * @param arr The array to modify.
 * @param index The index in the array.
 */
export function deleteAt<T>(arr: T[], index: number): T[] {
  if (index >= 0) {
    arr.splice(index, 1);
  }
  return arr;
}

/**
 * Converts `k` to a number if it represents a valid array index, or returns -1 if `k` isn't an index.
 */
export function toArrayIndex(k: any): number {
  return (typeof k === 'number' || (typeof k === 'string' && k === '' + (k = +k))) && k >>> 0 === k ? k : -1;
}
