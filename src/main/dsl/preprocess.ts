import { ParseOptions } from '../shared-types';
import { Shape } from '../shapes';

/**
 * Synchronously preprocesses the input value.
 *
 * @param cb The callback that processes the input value.
 * @template I The input value.
 * @template O The output value.
 */
export function preprocess<I, O>(cb: (input: I, options: Readonly<ParseOptions>) => O): Shape<I, O> {
  return new Shape().transform(cb);
}

/**
 * Asynchronously preprocesses the input value.
 *
 * @param cb The callback that processes the input value.
 * @template I The input value.
 * @template O The output value.
 */
export function preprocessAsync<I, O>(cb: (input: I, options: Readonly<ParseOptions>) => Promise<O>): Shape<I, O> {
  return new Shape().transformAsync(cb);
}
