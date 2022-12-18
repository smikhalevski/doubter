import {
  ApplyChecksCallback,
  ApplyResult,
  Check,
  CheckCallback,
  CheckOptions,
  Err,
  Message,
  Ok,
  ParseOptions,
  RefineOptions,
  TypeConstraintOptions,
} from '../shared-types';
import {
  anyTypes,
  appendCheck,
  captureIssues,
  createApplyChecksCallback,
  createIssueFactory,
  getPrototypeOf,
  getValueType,
  isArray,
  isEqual,
  ok,
  unique,
} from '../utils';
import { ValidationError } from '../ValidationError';
import {
  CODE_EXCLUSION,
  CODE_PREDICATE,
  MESSAGE_ERROR_ASYNC,
  MESSAGE_EXCLUSION,
  MESSAGE_PREDICATE,
} from '../constants';

const defaultParseOptions: ParseOptions = Object.freeze({ verbose: false });

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

/**
 * A shape that replaces a value from an input with an output value.
 *
 * @template S The base shape.
 * @template A The searched value.
 * @template B The value that is used as a replacement.
 */
export type OpaqueReplace<S extends AnyShape, A, B = A> = Shape<S['input'] | A, Exclude<S['output'], A> | B>;

/**
 * Excludes a value from both input and output.
 *
 * @template S The base shape.
 * @template T The excluded value.
 */
export type OpaqueExclude<S extends AnyShape, T> = Shape<Exclude<S['input'], T>, Exclude<S['output'], T>>;

/**
 * The detected runtime input value type.
 */
export type ValueType =
  | 'object'
  | 'array'
  | 'function'
  | 'string'
  | 'symbol'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'any'
  | 'never';

export interface Shape<I, O> {
  /**
   * The shape input type. Accessible only at compile time for type inference.
   */
  readonly input: I;

  /**
   * The shape output type. Accessible only at compile time for type inference.
   */
  readonly output: O;

  /**
   * Synchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode async}.
   */
  try(input: unknown, options?: ParseOptions): Ok<O> | Err;

  /**
   * Asynchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   */
  tryAsync(input: unknown, options?: ParseOptions): Promise<Ok<O> | Err>;

  /**
   * Synchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode async}.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  parse(input: unknown, options?: ParseOptions): O;

  /**
   * Asynchronously parses the value.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws {@linkcode ValidationError} if any issues occur during parsing.
   */
  parseAsync(input: unknown, options?: ParseOptions): Promise<O>;

  /**
   * Synchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode async}.
   */
  parseOrDefault<T = undefined>(input: unknown, defaultValue?: T, options?: ParseOptions): O | T;

  /**
   * Asynchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   */
  parseOrDefaultAsync<T = undefined>(input: unknown, defaultValue?: T, options?: ParseOptions): Promise<O | T>;
}

/**
 * The base shape.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class Shape<I = any, O = I> {
  /**
   * `true` if the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called.
   * `false` if the shape can be used in both sync and async contexts.
   */
  readonly async;

  /**
   * The list of checks applied to the shape output.
   */
  readonly checks: readonly Check[] = [];

  /**
   * The human-readable shape description.
   */
  description = '';

  /**
   * The list of runtime value types that can be processed by the shape.
   */
  protected _inputTypes: readonly ValueType[];

  /**
   * Applies checks to the output.
   */
  protected _applyChecks: ApplyChecksCallback | null = null;

  /**
   * `true` if some checks from {@linkcode checks} were marked as unsafe, `false` otherwise.
   */
  protected _unsafe = false;

  /**
   * Creates the new {@linkcode Shape} instance.
   *
   * @param inputTypes
   * @param async If `true` then the shape would allow only {@linkcode parseAsync} and throw an error if
   * {@linkcode parse} is called. Otherwise, shape can be used in both sync and async contexts.
   * @template I The input value.
   * @template O The output value.
   */
  constructor(inputTypes?: readonly ValueType[], async = false) {
    this._inputTypes =
      inputTypes === undefined || inputTypes.length === 0 || inputTypes.includes('any') ? anyTypes : unique(inputTypes);
    this.async = async;

    if (async) {
      this._apply = () => {
        throw new Error(MESSAGE_ERROR_ASYNC);
      };
    }
  }

  /**
   * Returns a sub-shape that describes a value associated with the given property name, or `null` if there's no such
   * sub-shape.
   *
   * @param key The key for which the sub-shape must be retrieved.
   * @returns The sub-shape or `null` if there's no such key in the shape.
   */
  at(key: unknown): AnyShape | null {
    return null;
  }

  /**
   * Adds a human-readable description text to the shape.
   *
   * @param text The description text.
   * @returns The clone of this shape with the description added.
   */
  describe(text: string): this {
    const shape = this._clone();
    shape.description = text;
    return shape;
  }

  /**
   * Appends the check that is applied to the shape output.
   *
   * If the {@linkcode CheckOptions.key} is defined and there's already a check with the same key then, it is removed
   * and a new check is appended to the list of shape checks. If the key is `undefined` then the `cb` identity is used
   * as a key.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of this shape with the check added.
   */
  check(cb: CheckCallback<O>, options: CheckOptions = {}): this {
    const { key = cb, unsafe = false, param } = options;

    const checks = this.checks.filter(check => check.key !== key);

    checks.push({ key, callback: cb, unsafe, param });

    const shape = this._clone();

    (shape as any).checks = checks;
    shape._applyChecks = createApplyChecksCallback(checks);
    shape._unsafe ||= unsafe;

    return shape;
  }

  /**
   * Redirects the shape output to another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @returns The {@linkcode RedirectShape} instance.
   * @template T The output value.
   */
  to<T>(shape: Shape<O, T>): Shape<I, T> {
    return new RedirectShape(this, shape);
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The callback that transforms the shape output value.
   * @returns The {@linkcode TransformShape} instance.
   * @template T The output value.
   */
  transform<T>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return The transformed value.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    cb: (output: O, options: Readonly<ParseOptions>) => T
  ): Shape<I, T> {
    return new TransformShape(this, false, cb);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The callback that transforms the shape output value.
   * @returns The {@linkcode TransformShape} instance.
   * @template T The transformed value.
   */
  transformAsync<T>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return The transformed value.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    cb: (output: O, options: Readonly<ParseOptions>) => Promise<T>
  ): Shape<I, T> {
    return new TransformShape(this, true, cb);
  }

  /**
   * Refines the shape output type with the [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
   *
   * @param cb The predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The constraint options or an issue message.
   * @returns The shape with the narrowed output.
   * @template T The narrowed output value.
   */
  refine<T extends O>(
    /**
     * @param output The shape output value.
     */
    cb: (output: O) => output is T,
    options?: RefineOptions | Message
  ): Shape<I, T>;

  /**
   * Checks that the output value conforms the predicate.
   *
   * @param cb The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
   * @param options The constraint options or an issue message.
   * @returns The clone of this shape.
   */
  refine(
    /**
     * @param output The shape output value.
     */
    cb: (output: O) => boolean,
    options?: RefineOptions | Message
  ): this;

  refine(cb: (output: O) => unknown, options?: RefineOptions | Message) {
    const issueFactory = createIssueFactory(CODE_PREDICATE, MESSAGE_PREDICATE, options, cb);

    return appendCheck(this, undefined, options, cb, (input, options) => {
      if (!cb(input)) {
        return issueFactory(input, options);
      }
    });
  }

  /**
   * Replaces `undefined` input value with an `undefined` output value.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  optional(): OpaqueReplace<this, undefined>;

  /**
   * Replaces `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  optional<T>(defaultValue: T): OpaqueReplace<this, undefined, T>;

  optional(defaultValue?: any) {
    return new ReplaceShape(this, undefined, defaultValue);
  }

  /**
   * Replaces `null` input value with an `null` output value.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullable(): OpaqueReplace<this, null>;

  /**
   * Replaces `null` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `null`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullable<T>(defaultValue: T): OpaqueReplace<this, null, T>;

  nullable(defaultValue?: any) {
    return new ReplaceShape(this, null, defaultValue);
  }

  /**
   * Passes `null` and `undefined` input value to the output.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullish(): OpaqueReplace<this, null | undefined>;

  /**
   * Replaces `null` and `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullish<T>(defaultValue?: T): OpaqueReplace<this, null | undefined, T>;

  nullish(defaultValue?: unknown) {
    return this.nullable(defaultValue).optional(defaultValue);
  }

  /**
   * Prevents an input and output from being undefined.
   *
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  nonOptional(options?: TypeConstraintOptions | Message): OpaqueExclude<this, undefined> {
    let shape: Shape = this;

    while (shape instanceof ReplaceShape && shape.checks.length === 0 && shape.searchedValue === undefined) {
      shape = shape.shape;
    }
    return new ExcludeShape(shape, undefined, options);
  }

  /**
   * Synchronously parses the input.
   *
   * Use {@linkcode parse} or {@linkcode try} instead of this method whenever possible. Override this method to
   * implement a custom shape.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  protected _apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { _applyChecks } = this;

    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  /**
   * Asynchronously parses the input.
   *
   * Use {@linkcode parseAsync} or {@linkcode tryAsync} instead of this method whenever possible. Override this method
   * to implement a custom shape that requires an async context.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O>> {
    return new Promise(resolve => resolve(this._apply(input, options)));
  }

  /**
   * Returns the shallow clone of this shape.
   */
  protected _clone(): this {
    return Object.assign(Object.create(getPrototypeOf(this)), this);
  }
}

Object.defineProperty(Shape.prototype, 'try', {
  get() {
    const cb: Shape['try'] = (input, options) => {
      const result = this._apply(input, options || defaultParseOptions);

      if (result === null) {
        return ok(input);
      }
      if (isArray(result)) {
        return { ok: false, issues: result };
      }
      return ok(result.value);
    };

    Object.defineProperty(this, 'try', { value: cb });

    return cb;
  },
});

Object.defineProperty(Shape.prototype, 'tryAsync', {
  get() {
    const cb: Shape['tryAsync'] = (input, options) => {
      return this['_applyAsync'](input, options || defaultParseOptions).then((result: ApplyResult) => {
        if (result === null) {
          return ok(input);
        }
        if (isArray(result)) {
          return { ok: false, issues: result };
        }
        return result;
      });
    };

    Object.defineProperty(this, 'tryAsync', { value: cb });

    return cb;
  },
});

Object.defineProperty(Shape.prototype, 'parse', {
  get() {
    const cb: Shape['parse'] = (input, options) => {
      const result = this._apply(input, options || defaultParseOptions);

      if (result === null) {
        return input;
      }
      if (isArray(result)) {
        throw new ValidationError(result);
      }
      return result.value;
    };

    Object.defineProperty(this, 'parse', { value: cb });

    return cb;
  },
});

Object.defineProperty(Shape.prototype, 'parseAsync', {
  get() {
    const cb: Shape['parseAsync'] = (input, options) => {
      return this['_applyAsync'](input, options || defaultParseOptions).then((result: ApplyResult) => {
        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          throw new ValidationError(result);
        }
        return result.value;
      });
    };

    Object.defineProperty(this, 'parseAsync', { value: cb });

    return cb;
  },
});

Object.defineProperty(Shape.prototype, 'parseOrDefault', {
  get() {
    const cb: Shape['parseOrDefault'] = (input, defaultValue, options) => {
      const result = this._apply(input, options || defaultParseOptions);

      if (result === null) {
        return input;
      }
      if (isArray(result)) {
        return defaultValue;
      }
      return result.value;
    };

    Object.defineProperty(this, 'parseOrDefault', { value: cb });

    return cb;
  },
});

Object.defineProperty(Shape.prototype, 'parseOrDefaultAsync', {
  get() {
    const cb: Shape['parseOrDefaultAsync'] = (input, defaultValue, options) => {
      return this['_applyAsync'](input, options || defaultParseOptions).then((result: ApplyResult) => {
        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          return defaultValue;
        }
        return result.value;
      });
    };

    Object.defineProperty(this, 'parseOrDefaultAsync', { value: cb });

    return cb;
  },
});

/**
 * The shape that applies a transformer callback to the base shape output.
 *
 * @template S The base shape.
 * @template O The transformed value.
 */
export class TransformShape<S extends AnyShape, O> extends Shape<S['input'], O> {
  /**
   * Creates the new {@linkcode TransformShape} instance.
   *
   * @param shape The base shape.
   * @param async If `true` then the transformed shape would await for the transformer to finish and use the resolved
   * value as an output. Otherwise, the value that is synchronously returned from the transformer is used as an output.
   * @param callback The callback that transforms the shape output value.
   * @template S The base shape.
   * @template O The transformed value.
   */
  constructor(
    /**
     * The base shape which output value is transformed.
     */
    readonly shape: S,
    async: boolean,
    /**
     * The callback that transforms the shape output value.
     *
     * @param output The {@linkcode shape} output value that must be transformed.
     * @param options Parsing options.
     * @return The transformation result.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    readonly callback: (output: S['output'], options: Readonly<ParseOptions>) => Promise<O> | O
  ) {
    super(shape['_inputTypes'], shape.async || async);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { shape, callback, _applyChecks } = this;

    let issues;
    let output = input;

    const result = shape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    try {
      output = callback(output, options);
    } catch (error) {
      return captureIssues(error);
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    if (isEqual(input, output)) {
      return null;
    }
    return ok(output as O);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O>> {
    if (!this.async) {
      return super._applyAsync(input, options);
    }

    const { shape, callback, _applyChecks } = this;

    return shape['_applyAsync'](input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return new Promise<O>(resolve => resolve(callback(output, options))).then(output => {
        let issues;

        if (_applyChecks !== null) {
          issues = _applyChecks(output, null, options);

          if (issues !== null) {
            return issues;
          }
        }
        if (isEqual(input, output)) {
          return null;
        }
        return ok(output);
      }, captureIssues);
    });
  }
}

/**
 * The shape that parses the output of the input shape with the output shape.
 *
 * @template I The input shape.
 * @template O The output shape.
 */
export class RedirectShape<I extends AnyShape, O extends Shape<I['output'], any>> extends Shape<
  I['input'],
  O['output']
> {
  /**
   * Creates the new {@linkcode RedirectShape} instance.
   *
   * @param inputShape The shape that parses the input value.
   * @param outputShape The shape that parses the output of `inputShape`.
   * @template I The input shape.
   * @template O The output shape.
   */
  constructor(
    /**
     * The input shape.
     */
    readonly inputShape: I,
    /**
     * The output shape.
     */
    readonly outputShape: O
  ) {
    super(inputShape['_inputTypes'], inputShape.async || outputShape.async);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<O['output']> {
    const { inputShape, outputShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = inputShape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    const outputResult = outputShape['_apply'](output, options);

    if (outputResult !== null) {
      if (isArray(outputResult)) {
        return outputResult;
      }
      result = outputResult;
      output = outputResult.value;
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O['output']>> {
    if (!this.async) {
      return super._applyAsync(input, options);
    }

    const { inputShape, outputShape, _applyChecks } = this;

    let result: ApplyResult = null;
    let output = input;

    return inputShape['_applyAsync'](input, options)
      .then(inputResult => {
        if (inputResult !== null) {
          if (isArray(inputResult)) {
            return inputResult;
          }
          result = inputResult;
          output = inputResult.value;
        }

        return outputShape['_applyAsync'](output, options);
      })
      .then(outputResult => {
        let issues;

        if (outputResult !== null) {
          if (isArray(outputResult)) {
            return outputResult;
          }
          result = outputResult;
          output = outputResult.value;
        }

        if (_applyChecks !== null) {
          issues = _applyChecks(output, null, options);

          if (issues !== null) {
            return issues;
          }
        }
        return result;
      });
  }
}

/**
 * The shape that replaces an input value with another value.
 *
 * @template S The shape that parses the input without the replaced value.
 * @template A The replaced value.
 * @template B The replacement value.
 */
export class ReplaceShape<S extends AnyShape, A, B = A> extends Shape<S['input'] | A, Exclude<S['output'], A> | B> {
  private _replacedResult: ApplyResult<B>;
  private _replacedResultPromise?: Promise<ApplyResult<B>>;

  /**
   * Creates the new {@linkcode ReplaceShape} instance.
   *
   * @param shape The shape that parses the input without the replaced value.
   * @param searchedValue The input that should be replaced.
   * @param value The replacement value. If `undefined` then the replaced value is returned as is without any parsing.
   * @template S The shape that parses the input without the replaced value.
   * @template A The searched value.
   * @template B The replacement value.
   */
  constructor(
    /**
     * The shape that parses the input without the replaced value.
     */
    readonly shape: S,
    /**
     * The replaced value.
     */
    readonly searchedValue: A,
    /**
     * The replacement value.
     */
    readonly value?: B
  ) {
    super(shape['_inputTypes'].concat(getValueType(searchedValue)), shape.async);

    this._replacedResult = value === undefined || isEqual(value, searchedValue) ? null : ok(value);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Exclude<S['output'], A> | B> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    const result = isEqual(input, this.searchedValue) ? this._replacedResult : this.shape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<Exclude<S['output'], A> | B>> {
    if (!this.async) {
      return super._applyAsync(input, options);
    }

    const { _applyChecks } = this;

    let issues;

    if (isEqual(input, this.searchedValue)) {
      if (_applyChecks !== null) {
        return new Promise(resolve => {
          issues = _applyChecks(this.value, null, options);

          resolve(issues !== null ? issues : this._replacedResult);
        });
      }
      return (this._replacedResultPromise ||= Promise.resolve(this._replacedResult));
    }

    return this.shape['_applyAsync'](input, options).then(result => {
      let issues;
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      if (_applyChecks !== null) {
        issues = _applyChecks(output, null, options);

        if (issues !== null) {
          return issues;
        }
      }
      return result;
    });
  }
}

/**
 * The shape that excludes a value from both input and output.
 *
 * @template S The base shape.
 * @template T The excluded value.
 */
export class ExcludeShape<S extends AnyShape, T> extends Shape<Exclude<S['input'], T>, Exclude<S['output'], T>> {
  protected _issueFactory;

  /**
   * Creates the new {@linkcode ExcludeShape} instance.
   *
   * @param shape The shape that parses the input without the replaced value.
   * @param excludedValue The excluded value.
   * @param options The constraint options or an issue message.
   * @template S The shape that parses the input without the replaced value.
   * @template T The excluded value.
   */
  constructor(
    /**
     * The base shape.
     */
    readonly shape: S,
    /**
     * The excluded value.
     */
    readonly excludedValue: T,
    options?: TypeConstraintOptions | Message
  ) {
    super(shape['_inputTypes'], shape.async);

    this._issueFactory = createIssueFactory(CODE_EXCLUSION, MESSAGE_EXCLUSION, options, excludedValue);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Exclude<S['output'], T>> {
    const { excludedValue, _issueFactory, _applyChecks } = this;

    let issues;
    let output = input;

    if (isEqual(input, excludedValue)) {
      return [_issueFactory(input, options)];
    }

    const result = this.shape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;

      if (isEqual(output, excludedValue)) {
        return [_issueFactory(input, options)];
      }
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<Exclude<S['output'], T>>> {
    if (!this.async) {
      return super._applyAsync(input, options);
    }

    const { excludedValue, _issueFactory, _applyChecks } = this;

    if (isEqual(input, excludedValue)) {
      return Promise.resolve([_issueFactory(input, options)]);
    }

    return this.shape['_applyAsync'](input, options).then(result => {
      let issues;
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;

        if (isEqual(output, excludedValue)) {
          return [_issueFactory(input, options)];
        }
      }

      if (_applyChecks !== null) {
        issues = _applyChecks(output, null, options);

        if (issues !== null) {
          return issues;
        }
      }
      return result;
    });
  }
}
