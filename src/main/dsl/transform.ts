import { TransformShape } from '../shapes';
import { ApplyOptions } from '../types';

/**
 * Creates the shape that synchronously transforms the input value.
 *
 * @param cb The callback that transforms the input value.
 * @template T The output value.
 */
export function transform<T>(
  /**
   * The callback that transforms the input value.
   *
   * @param value The input value.
   * @param options Parsing options.
   * @return The transformation result.
   * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   */
  cb: (value: any, options: Readonly<ApplyOptions>) => T
): TransformShape<T> {
  return new TransformShape(cb);
}

/**
 * Creates the shape that asynchronously transforms the input value.
 *
 * @param cb The callback that transforms the input value.
 * @template T The output value.
 */
export function transformAsync<T>(
  /**
   * The callback that transforms the input value.
   *
   * @param value The input value.
   * @param options Parsing options.
   * @return The transformation result.
   * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   */
  cb: (value: any, options: Readonly<ApplyOptions>) => Promise<T>
): TransformShape<T> {
  return new TransformShape(cb, true);
}
