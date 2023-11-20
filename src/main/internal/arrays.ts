export function unique<T>(values: T[]): T[];

export function unique<T>(values: readonly T[]): readonly T[];

export function unique<T>(values: readonly T[]): T[] {
  let arr = values as T[];

  for (let i = 0; i < values.length; ++i) {
    if (arr !== values) {
      if (!arr.includes(values[i])) {
        arr.push(values[i]);
      }
    } else if (values.includes(values[i], i + 1)) {
      arr = values.slice(0, i + 1);
    }
  }
  return arr;
}

/**
 * Converts `k` to a number if it represents a valid array index, or returns -1 if `k` isn't an index.
 */
export function toArrayIndex(k: any): number {
  return (typeof k === 'number' || (typeof k === 'string' && k === '' + (k = +k))) && k >>> 0 === k ? k : -1;
}
