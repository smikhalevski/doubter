import { AnyShape, ValueType } from './Shape';
import { ApplyResult, ConstraintOptions, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import {
  appendCheck,
  concatIssues,
  createIssueFactory,
  isArray,
  isEqual,
  ok,
  toArrayIndex,
  unshiftPath,
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
 * @template S The shape of set values.
 */
export class SetShape<S extends AnyShape> extends CoercibleShape<Set<S['input']>, Set<S['output']>> {
  protected _options;
  protected _issueFactory;

  /**
   * Creates a new {@linkcode SetShape} instance.
   *
   * @param shape The shape of an item in the set.
   * @param options The type constraint options or the type issue message.
   * @template S The shape of set values.
   */
  constructor(
    /**
     * The shape of set values.
     */
    readonly shape: S,
    options?: TypeConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._issueFactory = createIssueFactory(CODE_TYPE, MESSAGE_SET_TYPE, options, TYPE_SET);
  }

  at(key: unknown): AnyShape | null {
    return toArrayIndex(key) === -1 ? null : this.shape;
  }

  /**
   * Constrains the set size.
   *
   * @param length The minimum set size.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  size(length: number, options?: ConstraintOptions | Message): this {
    return this.min(length, options).max(length, options);
  }

  /**
   * Constrains the minimum set size.
   *
   * @param length The minimum set size.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  min(length: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_SET_MIN, MESSAGE_SET_MIN, options, length);

    return appendCheck(this, CODE_SET_MIN, options, length, (input, options) => {
      if (input.size < length) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Constrains the maximum set size.
   *
   * @param length The maximum set size.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  max(length: number, options?: ConstraintOptions | Message): this {
    const issueFactory = createIssueFactory(CODE_SET_MAX, MESSAGE_SET_MAX, options, length);

    return appendCheck(this, CODE_SET_MAX, options, length, (input, options) => {
      if (input.size > length) {
        return issueFactory(input, options);
      }
    });
  }

  protected _requiresAsync(): boolean {
    return this.shape.async;
  }

  protected _getInputTypes(): ValueType[] {
    if (this._coerced) {
      return this.shape['_getInputTypes']().concat(TYPE_OBJECT, TYPE_ARRAY);
    } else {
      return [TYPE_OBJECT];
    }
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<Set<S['output']>> {
    const { shape, _applyChecks, _unsafe } = this;

    let values: Array<unknown>;
    let issues: Issue[] | null = null;
    let changed = false;

    if (!(input instanceof Set)) {
      if (!(options.coerced || this._coerced)) {
        return this._issueFactory(input, options);
      }
      values = isArray(input) ? input : [input];
    } else {
      values = Array.from(input);
    }

    const valuesLength = values.length;

    for (let i = 0; i < valuesLength; ++i) {
      const value = values[i];
      const result = shape['_apply'](value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, i);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      changed = !isEqual(value, (values[i] = result.value));
    }

    const output = changed ? new Set(values) : input;

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && changed) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<Set<S['output']>>> {
    return new Promise(resolve => {
      const { shape, _applyChecks, _unsafe } = this;

      let values: Array<unknown>;

      if (!(input instanceof Set)) {
        if (!(options.coerced || this._coerced)) {
          return this._issueFactory(input, options);
        }
        values = isArray(input) ? input : [input];
      } else {
        values = Array.from(input);
      }

      const valuesLength = values.length;
      const promises: Promise<ApplyResult>[] = [];

      for (let i = 0; i < valuesLength; ++i) {
        promises.push(shape['_applyAsync'](values[i], options));
      }

      resolve(
        Promise.all(promises).then(results => {
          const resultsLength = results.length;

          let issues: Issue[] | null = null;
          let changed = false;

          for (let i = 0; i < resultsLength; ++i) {
            const result = results[i];

            if (result === null) {
              continue;
            }
            if (isArray(result)) {
              unshiftPath(result, i);

              if (!options.verbose) {
                return result;
              }
              issues = concatIssues(issues, result);
              continue;
            }
            changed = !isEqual(values[i], (values[i] = result.value));
          }

          const output = changed ? new Set(values) : input;

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
          }
          if (issues === null && changed) {
            return ok(output);
          }
          return issues;
        })
      );
    });
  }
}
