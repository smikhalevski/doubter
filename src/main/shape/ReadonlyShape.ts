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
  T;

export class ReadonlyShape<BaseShape extends AnyShape>
  extends Shape<Input<BaseShape>, ToReadonly<Output<BaseShape>>>
  implements DeepPartialProtocol<ReadonlyShape<DeepPartialShape<BaseShape>>>
{
  constructor(readonly baseShape: BaseShape) {
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
