import { Type } from '../Type';
import { isEqual } from './lang';

export function isType(value: unknown): value is Type {
  return value instanceof Type;
}

/**
 * Returns `true` if type or literal `a` is assignable to the type or literal `b`.
 */
export function isAssignable(a: unknown, b: unknown): boolean {
  return b === Type.UNKNOWN || isEqual(a, b) || Type.of(a) === b;
}

/**
 * Returns an array of unique types and literals that comprise a union.
 */
export function unionTypes(types: readonly unknown[]): readonly unknown[] {
  let t = types as unknown[];

  next: for (let i = 0; i < t.length; ++i) {
    const ti = t[i];

    for (let j = i + 1; j < t.length; ++j) {
      const tj = t[j];

      if (isAssignable(ti, tj)) {
        if (t === types) {
          t = types.slice(0);
        }
        t.splice(i--, 1);
        continue next;
      }

      if (isAssignable(tj, ti)) {
        if (t === types) {
          t = types.slice(0);
        }
        t.splice(j--, 1);
      }
    }
  }

  return t;
}

/**
 * Takes an array of arrays of types that are treated as an intersection of unions, and applies the distribution rule
 * that produces a union.
 *
 * ```
 * (a | b) & (a | b | c) → a | b
 * ```
 */
export function distributeTypes(types: ReadonlyArray<ReadonlyArray<unknown>>): unknown[] {
  if (types.length === 0) {
    return [];
  }

  const t = [];
  const t0 = types[0];

  for (let i = 0; i < t0.length; ++i) {
    const t0i = t0[i];

    for (let k = 1; k < types.length; ++k) {
      const tk = types[k];

      for (let j = 0; j < tk.length; ++j) {
        const tkj = tk[j];

        if (isAssignable(tkj, t0i)) {
          t.push(tkj);
        } else if (isAssignable(t0i, tkj)) {
          t.push(t0i);
        }
      }
    }
  }

  return t;
}
