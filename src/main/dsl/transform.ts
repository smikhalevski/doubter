import { ParseOptions } from '../shared-types';
import { Shape } from '../shapes';

/**
 * Creates the shape that synchronously transforms the input value.
 *
 * @param cb The callback that processes the input value.
 * @template I The input value.
 * @template O The output value.
 */
export function transform<I = any, O = any>(cb: (input: I, options: Readonly<ParseOptions>) => O): Shape<I, O> {
  return new Shape().transform(cb);
}

/**
 * Creates the shape that asynchronously transforms the input value.
 *
 * @param cb The callback that processes the input value.
 * @template I The input value.
 * @template O The output value.
 */
export function transformAsync<I = any, O = any>(
  cb: (input: I, options: Readonly<ParseOptions>) => Promise<O>
): Shape<I, O> {
  return new Shape().transformAsync(cb);
}
