import { NEVER } from '../coerce/NEVER';
import { CODE_TYPE_ENUM } from '../constants';
import { unique } from '../internal/arrays';
import { isArray } from '../internal/lang';
import { ReadonlyDict } from '../internal/objects';
import { TYPE_ARRAY, TYPE_OBJECT } from '../Type';
import { ApplyOptions, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a value enumeration.
 *
 * @template Value The union of allowed enum values.
 * @group Shapes
 */
export class EnumShape<Value> extends CoercibleShape<Value> {
  /**
   * The array of unique enum values.
   */
  readonly values: readonly Value[];

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link EnumShape} instance.
   *
   * @param source The array of allowed values, a const key-value mapping, or an enum object.
   * @param options The issue options or the issue message.
   * @template Value The union of allowed enum values.
   */
  constructor(
    /**
     * The array of allowed values, a const key-value mapping, or an TypeScript enum object.
     */
    readonly source: readonly Value[] | ReadonlyDict<Value>,
    options?: IssueOptions | Message
  ) {
    super();

    this.values = getEnumValues(source);

    this._typeIssueFactory = createIssueFactory(CODE_TYPE_ENUM, Shape.messages[CODE_TYPE_ENUM], options, this.values);
  }

  protected _getInputs(): unknown[] {
    const inputs: unknown[] = this.values.slice(0);

    if (!this.isCoercing || inputs.length === 0) {
      return inputs;
    }
    if (!isArray(this.source)) {
      inputs.push(...Object.keys(this.source));
    }
    return inputs.concat(TYPE_ARRAY, TYPE_OBJECT);
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Value> {
    let output = input;

    if (!this.values.includes(output) && (output = this._applyCoercion(input)) === NEVER) {
      return [this._typeIssueFactory(input, options)];
    }
    return this._applyOperations(input, output, options, null);
  }
}

/**
 * Returns unique values of the enum. Source must contain key-value and value-key mapping to be considered a native
 * enum.
 */
export function getEnumValues(source: ReadonlyDict): any[] {
  if (isArray(source)) {
    return unique(source);
  }

  const values: number[] = [];

  for (const key in source) {
    const a = source[key];
    const b = source[a];

    const aType = typeof a;
    const bType = typeof b;

    if (((aType !== 'string' || bType !== 'number') && (aType !== 'number' || bType !== 'string')) || b != key) {
      return unique(Object.values(source));
    }
    if (typeof a === 'number' && values.indexOf(a) === -1) {
      values.push(a);
    }
  }
  return values;
}
