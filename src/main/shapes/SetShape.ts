import {
  CODE_SET_MAX,
  CODE_SET_MIN,
  CODE_TYPE,
  MESSAGE_SET_MAX,
  MESSAGE_SET_MIN,
  MESSAGE_SET_TYPE,
} from '../constants';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  addCheck,
  canonize,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  isArray,
  isIterable,
  ok,
  toArrayIndex,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../utils';
import { ARRAY, OBJECT, SET } from '../utils/type-system';
import { CoercibleShape } from './CoercibleShape';
import { AnyShape, DeepPartialProtocol, NEVER, OptionalDeepPartialShape, Result } from './Shape';

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
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SET_TYPE, options, SET);
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

    return addCheck(this, CODE_SET_MIN, size, (input, param, options) => {
      if (input.size < param) {
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

    return addCheck(this, CODE_SET_MAX, size, (input, param, options) => {
      if (input.size > param) {
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

  protected _getInputTypes(): unknown[] {
    if (this.isCoerced) {
      return this.shape.inputTypes.concat(SET, OBJECT, ARRAY);
    } else {
      return [SET];
    }
  }

  protected _apply(input: any, options: ApplyOptions): Result<Set<S['output']>> {
    let changed = false;
    let values;
    let issues = null;

    if (
      // Not a Set
      !(input instanceof Set && (values = Array.from(input))) &&
      // No coercion or not coercible
      (!(options.coerced || this.isCoerced) || !(changed = (values = this._coerceValues(input)) !== NEVER))
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
      changed = true;
      values[i] = result.value;
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

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<Set<S['output']>>> {
    return new Promise(resolve => {
      let changed = false;
      let values: unknown[];

      if (
        // Not a Set
        !(input instanceof Set && (values = Array.from(input))) &&
        // No coercion or not coercible
        (!(options.coerced || this.isCoerced) || !(changed = (values = this._coerceValues(input)) !== NEVER))
      ) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { shape, _applyChecks, _isUnsafe } = this;
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
          return shape['_applyAsync'](values[index], options).then(handleResult);
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
   * Coerces a value to an array of `Set` values, or returns {@linkcode NEVER} if coercion isn't possible.
   *
   * @param value The non-`Set` value to coerce.
   */
  protected _coerceValues(value: unknown): unknown[] {
    value = canonize(value);

    if (isArray(value)) {
      return value;
    }
    if (isIterable(value)) {
      return Array.from(value);
    }
    return [value];
  }
}
