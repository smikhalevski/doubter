import { isArray, isPlainObject } from '../internal/lang';
import { cloneObject } from '../internal/objects';
import { toDeepPartialShape } from '../internal/shapes';
import { ParseOptions, Result } from '../types';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Input, Output, Shape } from './Shape';

// prettier-ignore
type ToReadonly<T> =
  T extends null | undefined ? T :
  T extends Array<infer V> ? readonly V[] :
  T extends Set<infer V> ? ReadonlySet<V> :
  T extends Map<infer K, infer V> ? ReadonlyMap<K, V> :
  T extends object ? Readonly<T> :
  T;

/**
 * The shape that makes the output readonly. Only freezes plain objects and arrays at runtime, other object types are
 * left intact.
 *
 * @template BaseShape The shape that parses the input.
 * @group Shapes
 */
export class ReadonlyShape<BaseShape extends AnyShape>
  extends Shape<Input<BaseShape>, ToReadonly<Output<BaseShape>>>
  implements DeepPartialProtocol<ReadonlyShape<DeepPartialShape<BaseShape>>>
{
  /**
   * Creates the new {@link ReadonlyShape} instance.
   *
   * @param baseShape The shape that parses the input.
   * @template BaseShape The shape that parses the input.
   */
  constructor(
    /**
     * The shape that parses the input.
     */
    readonly baseShape: BaseShape
  ) {
    super();
  }

  deepPartial(): ReadonlyShape<DeepPartialShape<BaseShape>> {
    return new ReadonlyShape(toDeepPartialShape(this.baseShape));
  }

  protected _isAsync(): boolean {
    return this.baseShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return this.baseShape.inputs;
  }

  protected _apply(input: unknown, options: ParseOptions, nonce: number): Result<ToReadonly<Output<BaseShape>>> {
    let output = input;
    let result = this.baseShape['_apply'](input, options, nonce);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (isPlainObject(output) || isArray(output)) {
      output = Object.freeze(output !== input ? output : isArray(output) ? output.slice(0) : cloneObject(output));
    }

    return this._applyOperations(input, output, options, null) as Result;
  }
}
