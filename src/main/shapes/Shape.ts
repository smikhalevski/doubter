import {
  Any,
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
  appendCheck,
  captureIssues,
  createApplyChecksCallback,
  createIssueFactory,
  getPrototypeOf,
  getValueType,
  isArray,
  isEqual,
  isUnsafeCheck,
  ok,
  returnTrue,
} from '../utils';
import { ValidationError } from '../ValidationError';
import {
  CODE_EXCLUSION,
  CODE_PREDICATE,
  ERROR_FORBIDDEN_AT_RUNTIME,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_EXCLUSION,
  MESSAGE_PREDICATE,
  TYPE_ANY,
} from '../constants';

const defaultParseOptions = Object.freeze<ParseOptions>({ verbose: false, coerced: false });

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

/**
 * A shape that replaces an input value with an output value.
 *
 * @template S The base shape.
 * @template A The input value to replace.
 * @template B The output value.
 */
export type OpaqueReplaceShape<S extends AnyShape, A, B = A> = Shape<S['input'] | A, Exclude<S['output'], A> | B>;

/**
 * Excludes a value from both input and output.
 *
 * @template S The base shape.
 * @template T The excluded value.
 */
export type OpaqueExcludeShape<S extends AnyShape, T> = Shape<Exclude<S['input'], T>, Exclude<S['output'], T>>;

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
  | 'date'
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
   * `true` if the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called.
   * `false` if the shape can be used in both sync and async contexts.
   */
  readonly async: boolean;

  /**
   * The list of checks applied to the shape output.
   */
  readonly checks: readonly Check[];

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
   * Synchronously parses the value and returns `undefined` if parsing fails.
   *
   * @param input The value to parse.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode async}.
   */
  parseOrDefault(input: unknown): O | undefined;

  /**
   * Synchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode async}.
   */
  parseOrDefault<T>(input: unknown, defaultValue: T, options?: ParseOptions): O | T;

  /**
   * Asynchronously parses the value and returns `undefined` value if parsing fails.
   *
   * @param input The value to parse.
   * @returns The value that conforms the output type of the shape.
   */
  parseOrDefaultAsync(input: unknown): Promise<O | undefined>;

  /**
   * Asynchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   */
  parseOrDefaultAsync<T>(input: unknown, defaultValue: T, options?: ParseOptions): Promise<O | T>;
}

/**
 * The baseline shape implementation.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class Shape<I = any, O = I> {
  /**
   * The human-readable shape description.
   */
  description = '';

  protected _checks: readonly Check[] = [];

  /**
   * Applies checks to the output.
   */
  protected _applyChecks: ApplyChecksCallback | null = null;

  /**
   * `true` if some checks from {@linkcode checks} were marked as unsafe, `false` otherwise.
   */
  protected _unsafe = false;

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

    const checks = this._checks.filter(check => check.key !== key);

    checks.push({ key, callback: cb, unsafe, param });

    return this.replaceChecks(checks);
  }

  /**
   * Returns a shape clone with all checks replaced with a new set of checks.
   *
   * @param checks The checks that the shape clone should use.
   * @returns The clone of this shape with a new set of checks.
   */
  replaceChecks(checks: readonly Check[]): this {
    const shape = this._clone();

    shape._checks = Object.freeze(checks.slice(0));
    shape._applyChecks = createApplyChecksCallback(checks);
    shape._unsafe = checks.some(isUnsafeCheck);

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
   * Replaces an input value with an output value.
   *
   * @param inputValue The input value to replace.
   * @param outputValue The output value that is returned if an `inputValue` is received.
   * @returns The {@linkcode ReplaceShape} instance.
   * @template A The input value to replace.
   * @template B The output value.
   */
  replace<A extends Any, B extends Any>(inputValue: A, outputValue: B): OpaqueReplaceShape<this, A, B> {
    return new ReplaceShape(this, inputValue, outputValue);
  }

  /**
   * Excludes value from both input and output.
   *
   * @param excludedValue The excluded value.
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode ExcludeShape} instance.
   * @template T The excluded value.
   */
  exclude<T extends Any>(excludedValue: T, options?: TypeConstraintOptions | Message): OpaqueExcludeShape<this, T> {
    return new ExcludeShape(this, excludedValue, options);
  }

  /**
   * Replaces `undefined` input value with an `undefined` output value.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  optional(): OpaqueReplaceShape<this, undefined>;

  /**
   * Replaces `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  optional<T extends Any>(defaultValue: T): OpaqueReplaceShape<this, undefined, T>;

  optional(defaultValue?: any) {
    return this.replace(undefined, defaultValue);
  }

  /**
   * Replaces `null` input value with an `null` output value.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullable(): OpaqueReplaceShape<this, null>;

  /**
   * Replaces `null` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `null`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullable<T extends Any>(defaultValue: T): OpaqueReplaceShape<this, null, T>;

  nullable(defaultValue?: any) {
    return this.replace(null, arguments.length === 0 ? null : defaultValue);
  }

  /**
   * Passes `null` and `undefined` input values directly to the output without parsing.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullish(): OpaqueReplaceShape<this, null | undefined>;

  /**
   * Replaces `null` and `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullish<T>(defaultValue?: T): OpaqueReplaceShape<this, null | undefined, T>;

  nullish(defaultValue?: any) {
    return this.nullable(arguments.length === 0 ? null : defaultValue).optional(defaultValue);
  }

  /**
   * Prevents an input and output from being `undefined`.
   *
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  nonOptional(options?: TypeConstraintOptions | Message): OpaqueExcludeShape<this, undefined> {
    return this.exclude(undefined, options);
  }

  /**
   * Returns the fallback value if parsing fails.
   *
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed.
   * @returns The {@linkcode CatchShape} instance.
   */
  catch(fallback: O | (() => O)): Shape<I, O> {
    return new CatchShape(this, fallback);
  }

  /**
   * Must return `true` if the shape must be used in async context only, otherwise the shape can be used in both sync
   * and async contexts. Override this method to implement a custom shape.
   */
  protected _requiresAsync(): boolean {
    return false;
  }

  /**
   * Returns the list of runtime value types that can be processed by the shape. Used for various optimizations.
   */
  protected _getInputTypes(): ValueType[] {
    return [TYPE_ANY];
  }

  /**
   * Returns the list of all input values that are known beforehand.
   */
  protected _getInputValues(): unknown[] {
    return [];
  }

  /**
   * Synchronously parses the input.
   *
   * Override this method to implement a custom shape.
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
   * Override this method to implement a custom shape that requires an async execution context.
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

Object.defineProperties(Shape.prototype, {
  input: {
    get() {
      throw new Error(ERROR_FORBIDDEN_AT_RUNTIME);
    },
  },

  output: {
    get() {
      throw new Error(ERROR_FORBIDDEN_AT_RUNTIME);
    },
  },

  async: {
    get(this: Shape) {
      const async = this._requiresAsync();
      const _applyAsync = Shape.prototype['_applyAsync'];

      if (async) {
        this._apply = () => {
          throw new Error(ERROR_REQUIRES_ASYNC);
        };
      } else if (this._applyAsync !== _applyAsync) {
        this._applyAsync = _applyAsync;
      }

      Object.defineProperty(this, 'async', { value: async });

      return async;
    },
  },

  checks: {
    get(this: Shape) {
      return this._checks;
    },
  },

  try: {
    get(this: Shape) {
      void this.async;

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
  },

  tryAsync: {
    get(this: Shape) {
      void this.async;

      const cb: Shape['tryAsync'] = (input, options) => {
        return this._applyAsync(input, options || defaultParseOptions).then((result: ApplyResult) => {
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
  },

  parse: {
    get(this: Shape) {
      void this.async;

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
  },

  parseAsync: {
    get(this: Shape) {
      void this.async;

      const cb: Shape['parseAsync'] = (input, options) => {
        return this._applyAsync(input, options || defaultParseOptions).then((result: ApplyResult) => {
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
  },

  parseOrDefault: {
    get(this: Shape) {
      void this.async;

      const cb: Shape['parseOrDefault'] = (input: unknown, defaultValue?: unknown, options?: ParseOptions) => {
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
  },

  parseOrDefaultAsync: {
    get(this: Shape) {
      void this.async;

      const cb: Shape['parseOrDefaultAsync'] = (input: unknown, defaultValue?: unknown, options?: ParseOptions) => {
        return this._applyAsync(input, options || defaultParseOptions).then((result: ApplyResult) => {
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
   * @param async If `true` then the transformed shape would wait for the promise returned from the callback to be
   * fulfilled. Otherwise, the value that is synchronously returned from the callback is used as an output.
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
    super();

    if (async) {
      this._requiresAsync = returnTrue;
    }
  }

  protected _requiresAsync(): boolean {
    return this.shape.async;
  }

  protected _getInputTypes(): ValueType[] {
    return this.shape['_getInputTypes']();
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']();
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
    super();
  }

  protected _requiresAsync(): boolean {
    return this.inputShape.async || this.outputShape.async;
  }

  protected _getInputTypes(): ValueType[] {
    return this.inputShape['_getInputTypes']();
  }

  protected _getInputValues(): unknown[] {
    return this.inputShape['_getInputValues']();
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
 * The shape that replaces an input value with an output value.
 *
 * @template S The shape that parses the input without the replaced value.
 * @template A The input value to replace.
 * @template B The output value.
 */
export class ReplaceShape<S extends AnyShape, A, B> extends Shape<S['input'] | A, Exclude<S['output'], A> | B> {
  private _result: ApplyResult<B>;

  /**
   * Creates the new {@linkcode ReplaceShape} instance.
   *
   * @param shape The shape that parses the input without the replaced value.
   * @param inputValue The input value to replace.
   * @param outputValue The output value that is returned if an `inputValue` is received.
   * @template S The shape that parses the input without the replaced value.
   * @template A The input value to replace.
   * @template B The output value.
   */
  constructor(
    /**
     * The shape that parses the input without the replaced value.
     */
    readonly shape: S,
    /**
     * The input value to replace.
     */
    readonly inputValue: A,
    /**
     * The output value that is returned if an {@linkcode inputValue} is received.
     */
    readonly outputValue: B
  ) {
    super();

    this._result = isEqual(inputValue, outputValue) ? null : ok(outputValue);
  }

  protected _requiresAsync(): boolean {
    return this.shape.async;
  }

  protected _getInputTypes(): ValueType[] {
    return this.shape['_getInputTypes']().concat(getValueType(this.inputValue));
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']().concat(this.inputValue);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Exclude<S['output'], A> | B> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    const result = isEqual(input, this.inputValue) ? this._result : this.shape['_apply'](input, options);

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
    const { _applyChecks } = this;

    let issues;

    if (isEqual(input, this.inputValue)) {
      if (_applyChecks !== null) {
        return new Promise(resolve => {
          issues = _applyChecks(this.outputValue, null, options);

          resolve(issues !== null ? issues : this._result);
        });
      }

      return Promise.resolve(this._result);
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
    super();

    this._issueFactory = createIssueFactory(CODE_EXCLUSION, MESSAGE_EXCLUSION, options, excludedValue);
  }

  protected _requiresAsync(): boolean {
    return this.shape.async;
  }

  protected _getInputTypes(): ValueType[] {
    return this.shape['_getInputTypes']();
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']().filter(value => !isEqual(this.excludedValue, value));
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Exclude<S['output'], T>> {
    const { excludedValue, _issueFactory, _applyChecks } = this;

    let issues;
    let output = input;

    if (isEqual(input, excludedValue)) {
      return _issueFactory(input, options);
    }

    const result = this.shape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;

      if (isEqual(output, excludedValue)) {
        return _issueFactory(input, options);
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
    const { excludedValue, _issueFactory, _applyChecks } = this;

    if (isEqual(input, excludedValue)) {
      return Promise.resolve(_issueFactory(input, options));
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
          return _issueFactory(input, options);
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

/**
 * The shape that returns the fallback value if parsing fails.
 *
 * @template S The shape that parses the input.
 */
export class CatchShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  private _resultProvider: () => Ok<S['output']>;

  /**
   * Creates the new {@linkcode CatchShape} instance.
   *
   * @param shape The shape that parses the input.
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed.
   * @template S The shape that parses the input.
   */
  constructor(
    /**
     * The base shape.
     */
    readonly shape: S,
    /**
     * The value or a callback that returns a value that is returned if parsing has failed.
     */
    readonly fallback: S['output'] | (() => S['output'])
  ) {
    super();

    if (typeof fallback === 'function') {
      this._resultProvider = () => ok((fallback as Function)());
    } else {
      const result = ok(fallback);
      this._resultProvider = () => result;
    }
  }

  protected _requiresAsync(): boolean {
    return this.shape.async;
  }

  protected _getInputTypes(): ValueType[] {
    return this.shape['_getInputTypes']();
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']();
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<S['output']> {
    const { _applyChecks } = this;

    let result = this.shape['_apply'](input, options);
    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        result = this._resultProvider();
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

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output']>> {
    const { _applyChecks } = this;

    return this.shape['_applyAsync'](input, options).then(result => {
      let issues;
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          result = this._resultProvider();
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
