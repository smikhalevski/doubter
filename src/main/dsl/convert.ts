import { ConvertShape, Shape } from '../shape';
import { ApplyOptions } from '../types';

/**
 * Creates the shape that synchronously converts the input value.
 *
 * @param cb The callback that converts the input value. Throw a {@link ValidationError} to notify that the conversion
 * cannot be successfully completed.
 * @template Value The input value.
 * @template ConvertedValue The output value.
 * @group DSL
 */
export function convert<Value = any, ConvertedValue = Value>(
  /**
   * @param value The input value.
   * @param options Parsing options.
   */
  cb: (value: any, options: ApplyOptions) => ConvertedValue
): Shape<Value, ConvertedValue> {
  return new ConvertShape(cb);
}

/**
 * Creates the shape that asynchronously converts the input value.
 *
 * @param cb The callback that converts the input value asynchronously. The returned promise can be rejected with a
 * {@link ValidationError} to notify that the conversion cannot be successfully completed.
 * @template Value The input value.
 * @template ConvertedValue The output value.
 * @group DSL
 */
export function convertAsync<Value = any, ConvertedValue = Value>(
  /**
   * @param value The input value.
   * @param options Parsing options.
   */
  cb: (value: any, options: ApplyOptions) => PromiseLike<ConvertedValue>
): Shape<Value, ConvertedValue> {
  return new ConvertShape(cb, true);
}
