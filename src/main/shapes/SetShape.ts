import { AnyShape, DeepPartialProtocol, OptionalDeepPartialShape, Result, ValueType } from './Shape';
import { ConstraintOptions, Issue, Message, ParseOptions } from '../shared-types';
import {
  addConstraint,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isEqual,
  isIterableObject,
  ok,
  toArrayIndex,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../utils';
import {
  CODE_SET_MAX,
  CODE_SET_MIN,
  CODE_TYPE,
  MESSAGE_SET_MAX,
  MESSAGE_SET_MIN,
  MESSAGE_SET_TYPE,
  TYPE_ARRAY,
  TYPE_OBJECT,
  TYPE_SET,
} from '../constants';
import { CoercibleShape } from './CoercibleShape';

/**
 * The shape of a `Set` instance.
 *
 * @template S The value shape.
 */
export class SetShape<S extends AnyShape>
  extends CoercibleShape<Set<S['input']>, Set<S['output']>>
  implements DeepPartialProtocol<SetShape<OptionalDeepPartialShape<S>>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode SetShape} instance.
   *
   * @param shape The value shape
   * @param options The type constraint options or the type issue message.
   * @template S The value shape.
   */
  constructor(
    /**
     * The value shape
     */
    readonly shape: S,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SET_TYPE, options, TYPE_SET);
  }

  at(key: unknown): AnyShape | null {
    return toArrayIndex(key) === -1 ? null : this.shape;
  }

  /**
   * Constrains the set size.
   *
   * @param size The minimum set size.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  size(size: number, options?: ConstraintOptions | Message): this {
    return this.min(size, options).max(size, options);
  }

  /**
   * Constrains the minimum set size.
   *
   * @param size The minimum set size.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(size: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_SET_MIN, MESSAGE_SET_MIN, options, size);

    return addConstraint(this, CODE_SET_MIN, size, (input, options) => {
      if (input.size < size) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the maximum set size.
   *
   * @param size The maximum set size.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(size: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_SET_MAX, MESSAGE_SET_MAX, options, size);

    return addConstraint(this, CODE_SET_MAX, size, (input, options) => {
      if (input.size > size) {
        return issueFactory(input, options);
      }
    });
  }

  deepPartial(): SetShape<OptionalDeepPartialShape<S>> {
    return copyUnsafeChecks(this, new SetShape<any>(toDeepPartialShape(this.shape).optional(), this._options));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    if (this.isCoerced) {
      return this.shape.inputTypes.concat(TYPE_OBJECT, TYPE_ARRAY);
    } else {
      return [TYPE_OBJECT];
    }
  }

  protected _apply(input: any, options: ParseOptions): Result<Set<S['output']>> {
    let changed = false;
    let values;
    let issues = null;

    if (
      // Not a Set
      !(input instanceof Set && (values = Array.from(input))) &&
      // No coercion or not coercible
      (!(options.coerced || this.isCoerced) || !(changed = (values = this._coerceValues(input)) !== null))
    ) {
      return this._typeIssueFactory(input, options);
    }

    const { shape, _applyChecks, _isUnsafe } = this;
    const valuesLength = values.length;

    for (let i = 0; i < valuesLength; ++i) {
      const value = values[i];
      const result = shape['_apply'](value, options);

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
      if ((changed = !isEqual(value, result.value))) {
        values[i] = result.value;
      }
    }

    const output = changed ? new Set(values) : input;

    if (_applyChecks !== null && (_isUnsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (changed && issues === null) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<Result<Set<S['output']>>> {
    return new Promise(resolve => {
      let changed = false;
      let values: unknown[];

      if (
        // Not a Set
        !(input instanceof Set && (values = Array.from(input))) &&
        // No coercion or not coercible
        (!(options.coerced || this.isCoerced) || !(changed = (values = this._coerceValues(input)!) !== null))
      ) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { shape, _applyChecks, _isUnsafe } = this;
      const valuesLength = values.length;

      let issues: Issue[] | null = null;
      let index = -1;
      let value: unknown;

      const handleResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            unshiftIssuesPath(result, index);

            if (!options.verbose) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else if ((changed = !isEqual(value, result.value))) {
            values[index] = result.value;
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== valuesLength) {
          return shape['_applyAsync']((value = values[index]), options).then(handleResult);
        }

        const output = changed ? new Set(values) : input;

        if (_applyChecks !== null && (_isUnsafe || issues === null)) {
          issues = _applyChecks(output, issues, options);
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
   * Coerces value to a array of `Set` values, or returns `null` if coercion isn't possible.
   *
   * @param value The non-`Set` value to coerce.
   */
  protected _coerceValues(value: unknown): unknown[] | null {
    if (isArray(value)) {
      return value;
    }
    if (isIterableObject(value)) {
      return Array.from(value);
    }
    return [value];
  }
}
