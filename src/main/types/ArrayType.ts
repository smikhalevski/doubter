import { AnyType, InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, shallowClone } from '../utils';

/**
 * The array type definition.
 *
 * @template X The type definition of array elements.
 */
export class ArrayType<X extends AnyType> extends Type<InferType<X>[]> {
  private _minLength?: number;
  private _maxLength?: number;

  /**
   * Creates a new {@link ArrayType} instance.
   *
   * @param _type The type definition of array elements. If `null` then element types aren't constrained at runtime.
   */
  constructor(private _type: X | null) {
    super();
  }

  /**
   * Constrains the minimum array length.
   *
   * @param length The minimum length of the array to satisfy the constraint.
   */
  min(length: number): this {
    const type = shallowClone(this);
    type._minLength = length;
    return type;
  }

  /**
   * Constrains the maximum array length.
   *
   * @param length The maximum length of the array to satisfy the constraint.
   */
  max(length: number): this {
    const type = shallowClone(this);
    type._maxLength = length;
    return type;
  }

  /**
   * Constrains the array length.
   *
   * @param length The length of the array to satisfy the constraint.
   */
  length(length: number): this {
    return this.min(length).max(length);
  }

  isAsync(): boolean {
    const { _type } = this;

    return _type !== null && _type.isAsync();
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!Array.isArray(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'array'));
      return input;
    }

    const { _minLength, _maxLength, _type } = this;
    const inputLength = input.length;

    if (_minLength !== undefined && inputLength < _minLength) {
      context.raiseIssue(createIssue(context, 'arrayMinLength', input, _minLength));

      if (context.aborted) {
        return input;
      }
    }

    if (_maxLength !== undefined && inputLength > _maxLength) {
      context.raiseIssue(createIssue(context, 'arrayMaxLength', input, _maxLength));

      if (context.aborted) {
        return input;
      }
    }

    if (_type === null) {
      return input.slice(0);
    }

    if (this.isAsync()) {
      const promises = [];

      for (let i = 0; i < inputLength; ++i) {
        promises.push(_type._parse(input[i], context.fork().enterKey(i)));
      }

      return Promise.all(promises);
    }

    const output = [];

    for (let i = 0; i < inputLength; ++i) {
      context.enterKey(i);
      output[i] = _type._parse(input[i], context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }
    return output;
  }
}
