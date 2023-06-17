import { CheckCallback, Output, Shape } from './core';

/**
 * The shortcut to add built-in checks to shapes.
 */
export function addCheck<S extends Shape, P>(shape: S, key: string, param: P, cb: CheckCallback<Output<S>, P>): S {
  return shape.check(cb, { key, param, unsafe: true });
}
