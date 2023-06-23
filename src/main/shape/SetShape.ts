import { CODE_TYPE, MESSAGE_SET_TYPE } from '../constants';
import {
  concatIssues,
  copyUnsafeChecks,
  getCanonicalValueOf,
  isArray,
  isIterableObject,
  ok,
  toArrayIndex,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../internal';
import { TYPE_ARRAY, TYPE_OBJECT, TYPE_SET } from '../Type';
import { ApplyOptions, ConstraintOptions, Issue, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, Input, NEVER, OptionalDeepPartialShape, Output } from './Shape';

/**
 * The shape of a `Set` instance.
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
   * Creates a new {@linkcode SetShape} instance.
   *
   * @param shape The value shape.
   * @param options The type constraint options or the type issue message.
   * @template ValueShape The value shape.
   */
  constructor(
    /**
     * The value shape.
     */
    readonly shape: ValueShape,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SET_TYPE, options, TYPE_SET);
  }

  at(key: unknown): AnyShape | null {
    return toArrayIndex(key) === -1 ? null : this.shape;
  }

  deepPartial(): SetShape<OptionalDeepPartialShape<ValueShape>> {
    return copyUnsafeChecks(this, new SetShape<any>(toDeepPartialShape(this.shape).optional(), this._options));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputs(): unknown[] {
    if (this.isCoercing) {
      return this.shape.inputs.concat(TYPE_SET, TYPE_OBJECT, TYPE_ARRAY);
    } else {
      return [TYPE_SET];
    }
  }

  protected _apply(input: any, options: ApplyOptions, nonce: number): Result<Set<Output<ValueShape>>> {
    let changed = false;
    let values;
    let issues = null;

    if (
      // Not a Set
      !(input instanceof Set && (values = Array.from(input))) &&
      // No coercion or not coercible
      (!(options.coerce || this.isCoercing) || !(changed = (values = this._coerce(input)) !== NEVER))
    ) {
      return [this._typeIssueFactory(input, options)];
    }

    const { shape, _applyOperations, _isForced } = this;
    const valuesLength = values.length;

    for (let i = 0; i < valuesLength; ++i) {
      const value = values[i];
      const result = shape['_apply'](value, options, nonce);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftIssuesPath(result, i);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      changed = true;
      values[i] = result.value;
    }

    const output = changed ? new Set(values) : input;

    if (_applyOperations !== null && (_isForced || issues === null)) {
      return _applyOperations(output, options, changed, issues, null);
    }
    if (changed && issues === null) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ApplyOptions, nonce: number): Promise<Result<Set<Output<ValueShape>>>> {
    return new Promise(resolve => {
      let changed = false;
      let values: unknown[];

      if (
        // Not a Set
        !(input instanceof Set && (values = Array.from(input))) &&
        // No coercion or not coercible
        (!(options.coerce || this.isCoercing) || !(changed = (values = this._coerce(input)) !== NEVER))
      ) {
        resolve([this._typeIssueFactory(input, options)]);
        return;
      }

      const { shape, _applyOperations, _isForced } = this;
      const valuesLength = values.length;

      let issues: Issue[] | null = null;
      let index = -1;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            unshiftIssuesPath(result, index);

            if (!options.verbose) {
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
          return shape['_applyAsync'](values[index], options, nonce).then(handleResult);
        }

        const output = changed ? new Set(values) : input;

        if (_applyOperations !== null && (_isForced || issues === null)) {
          return _applyOperations(output, options, changed, issues, null);
        }
        if (changed && issues === null) {
          return ok(output);
        }
        return issues;
      };

      resolve(next());
    });
  }

  /**
   * Coerces a value to an array of `Set` values.
   *
   * @param value The non-`Set` value to coerce.
   * @returns An array, or {@linkcode NEVER} if coercion isn't possible.
   */
  protected _coerce(value: unknown): unknown[] {
    value = getCanonicalValueOf(value);

    if (isArray(value)) {
      return value;
    }
    if (isIterableObject(value)) {
      return Array.from(value);
    }
    return [value];
  }
}
