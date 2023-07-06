import { ConvertShape } from '../shape';
import { ApplyOptions } from '../types';

/**
 * Creates the shape that synchronously converts the input value.
 *
 * @param cb The callback that converts the input value.
 * @template ConvertedValue The output value.
 * @group DSL
 */
export function convert<ConvertedValue>(
  /**
   * The callback that converts the input value.
   *
   * Throw a {@linkcode ValidationError} to notify that the conversion cannot be successfully completed.
   *
   * @param value The input value.
   * @param options Parsing options.
   * @return The conversion result.
   */
  cb: (value: any, options: ApplyOptions) => ConvertedValue
): ConvertShape<ConvertedValue> {
  return new ConvertShape(cb);
}

/**
 * Creates the shape that asynchronously converts the input value.
 *
 * @param cb The callback that converts the input value.
 * @template ConvertedValue The output value.
 * @group DSL
 */
export function convertAsync<ConvertedValue>(
  /**
   * The callback that converts the input value.
   *
   * Reject with a {@linkcode ValidationError} to notify that the conversion cannot be successfully completed.
   *
   * @param value The input value.
   * @param options Parsing options.
   * @return The conversion result.
   */
  cb: (value: any, options: ApplyOptions) => PromiseLike<ConvertedValue>
): ConvertShape<ConvertedValue> {
  return new ConvertShape(cb, true);
}
