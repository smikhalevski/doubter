import { NEVER } from '../coerce/never';
import { CODE_TYPE } from '../constants';
import { toArrayIndex, unique } from '../internal/arrays';
import { freeze, getCanonicalValue, isArray, isIterableObject } from '../internal/lang';
import { concatIssues, toDeepPartialShape, unshiftIssuesPath } from '../internal/shapes';
import { Type } from '../Type';
import { ApplyOptions, Issue, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, Input, OptionalDeepPartialShape, Output, Shape } from './Shape';

const setInputs = freeze([Type.SET]);

/**
 * The shape of a {@link !Set Set} instance.
 *
 * @template ValueShape The value shape.
 * @group Shapes
 */
export class SetShape<ValueShape extends AnyShape>
  extends CoercibleShape<Set<Input<ValueShape>>, Set<Output<ValueShape>>, unknown[]>
  implements DeepPartialProtocol<SetShape<OptionalDeepPartialShape<ValueShape>>>
{
  /**
   * The type constraint options or the type issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@link SetShape} instance.
   *
   * @param valueShape The value shape.
   * @param options The issue options or the issue message.
   * @template ValueShape The value shape.
   */
  constructor(
    /**
     * The value shape.
     */
    readonly valueShape: ValueShape,
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.set'], options, Type.SET);
  }

  at(key: unknown): AnyShape | null {
    return toArrayIndex(key) === -1 ? null : this.valueShape;
  }

  deepPartial(): SetShape<OptionalDeepPartialShape<ValueShape>> {
    return new SetShape<any>(toDeepPartialShape(this.valueShape).optional(), this._options);
  }

  protected _isAsync(): boolean {
    return this.valueShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return this.isCoercing ? this.valueShape.inputs.concat(Type.SET, Type.OBJECT, Type.ARRAY) : setInputs;
  }

  /**
   * Coerces a value to an array of unique values.
   *
   * @param input The value to coerce.
   * @returns An array, or {@link NEVER} if coercion isn't possible.
   */
  protected _coerce(input: unknown): unknown[] {
    if (isArray(input)) {
      return unique(input);
    }
    if (isIterableObject(getCanonicalValue(input))) {
      return unique(Array.from(input as Iterable<unknown>));
    }
    return [input];
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Set<Output<ValueShape>>> {
    let changed = false;
    let values;
    let issues = null;

    if (
      // Not a Set
      !(input instanceof Set && (values = Array.from(input))) &&
      // No coercion or not coercible
      !(changed = (values = this._applyCoerce(input)) !== NEVER)
    ) {
      return [this._typeIssueFactory(input, options)];
    }

    const { valueShape } = this;
    const valuesLength = values.length;

    for (let i = 0; i < valuesLength; ++i) {
      const value = values[i];
      const result = valueShape['_apply'](value, options, nonce);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftIssuesPath(result, i);

        if (options.earlyReturn) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      changed = true;
      values[i] = result.value;
    }

    return this._applyOperations(input, changed ? new Set(values) : input, options, issues) as Result;
  }

  protected _applyAsync(input: any, options: ApplyOptions, nonce: number): Promise<Result<Set<Output<ValueShape>>>> {
    return new Promise(resolve => {
      let changed = false;
      let values: unknown[];

      if (
        // Not a Set
        !(input instanceof Set && (values = Array.from(input))) &&
        // No coercion or not coercible
        !(changed = (values = this._applyCoerce(input)) !== NEVER)
      ) {
        resolve([this._typeIssueFactory(input, options)]);
        return;
      }

      const { valueShape } = this;
      const valuesLength = values.length;

      let issues: Issue[] | null = null;
      let index = -1;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            unshiftIssuesPath(result, index);

            if (options.earlyReturn) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else {
            changed = true;
            values[index] = result.value;
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== valuesLength) {
          return valueShape['_applyAsync'](values[index], options, nonce).then(handleResult);
        }
        return this._applyOperations(input, changed ? new Set(values) : input, options, issues);
      };

      resolve(next());
    });
  }
}
