import { TransformShape } from '../shapes';
import { ApplyOptions } from '../types';

/**
 * Creates the shape that synchronously transforms the input value.
 *
 * @param cb The callback that transforms the input value.
 * @template TransformedValue The output value.
 */
export function transform<TransformedValue>(
  /**
   * The callback that transforms the input value.
   *
   * @param value The input value.
   * @param options Parsing options.
   * @return The transformation result.
   * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   */
  cb: (value: any, options: Readonly<ApplyOptions>) => TransformedValue
): TransformShape<TransformedValue> {
  return new TransformShape(cb);
}

/**
 * Creates the shape that asynchronously transforms the input value.
 *
 * @param cb The callback that transforms the input value.
 * @template TransformedValue The output value.
 */
export function transformAsync<TransformedValue>(
  /**
   * The callback that transforms the input value.
   *
   * @param value The input value.
   * @param options Parsing options.
   * @return The transformation result.
   * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   */
  cb: (value: any, options: Readonly<ApplyOptions>) => Promise<TransformedValue>
): TransformShape<TransformedValue> {
  return new TransformShape(cb, true);
}
