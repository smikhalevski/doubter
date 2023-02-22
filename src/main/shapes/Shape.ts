import {
  Check,
  CheckCallback,
  CheckOptions,
  ConstraintOptions,
  Err,
  Issue,
  Literal,
  Message,
  Ok,
  ParseOptions,
  RefineOptions,
} from '../shared-types';
import {
  captureIssues,
  cloneObject,
  copyUnsafeChecks,
  createApplyChecksCallback,
  createIssueFactory,
  getValueType,
  isArray,
  isEqual,
  isUnsafeCheck,
  ok,
  toDeepPartialShape,
  unique,
} from '../utils';
import { ValidationError } from '../ValidationError';
import {
  CODE_EXCLUSION,
  CODE_NOT,
  CODE_PREDICATE,
  ERROR_FORBIDDEN_AT_RUNTIME,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_EXCLUSION,
  MESSAGE_NOT,
  MESSAGE_PREDICATE,
  TYPE_ANY,
  TYPE_NEVER,
} from '../constants';

export const defaultParseOptions = Object.freeze<ParseOptions>({ verbose: false, coerced: false });

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

/**
 * An alias for {@linkcode ReplaceShape} that allows the same value as both an input and an output.
 *
 * @template S The shape that parses the input without the replaced value.
 * @template T The value that is allows as an input and output.
 */
export interface IncludeShape<S extends AnyShape, T>
  extends Shape<S['input'] | T, S['output'] | T>,
    DeepPartialProtocol<IncludeShape<DeepPartialShape<S>, T>> {}

/**
 * The unique symbol that is used for type branding.
 */
export declare const BRAND: unique symbol;

/**
 * An opaque shape that adds a brand to the output type.
 *
 * @template S The shape which output must be branded.
 * @template T The brand value.
 */
// prettier-ignore
export type BrandShape<S extends AnyShape & Partial<DeepPartialProtocol<AnyShape>>, T> =
  & Shape<S['input'], S['output'] & { [BRAND]: T }>
  & Pick<S, keyof DeepPartialProtocol<AnyShape>>;

/**
 * A shape should implement {@linkcode DeepPartialProtocol} to be converted to deep partial.
 *
 * @template T The deep partial alternative of the shape.
 */
export interface DeepPartialProtocol<T extends AnyShape> {
  /**
   * Converts the shape and its child shapes to deep partial alternatives.
   *
   * @returns The deep partial clone of the shape.
   */
  deepPartial(): T;
}

/**
 * Returns the deep partial alternative of the shape if it implements {@linkcode DeepPartialProtocol}, or returns shape
 * as is if it doesn't.
 *
 * @template S The shape to convert to a deep partial alternative.
 */
export type DeepPartialShape<S extends AnyShape> = S extends DeepPartialProtocol<infer T> ? T : S;

/**
 * Shape that is both optional and deep partial.
 *
 * @template S The shape to convert to an optional deep partial alternative.
 */
export type OptionalDeepPartialShape<S extends AnyShape> = IncludeShape<DeepPartialShape<S>, undefined>;

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

/**
 * The result of shape application. This is the part of the internal API required for creating custom shapes.
 */
export type ApplyResult<T = any> = Ok<T> | Issue[] | null;
/**
 * The callback to which shape checks are compiled, see {@linkcode Shape._applyChecks}.
 */
export type ApplyChecksCallback = (output: any, issues: Issue[] | null, options: ParseOptions) => Issue[] | null;

/**
 * The baseline shape implementation.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class Shape<I = any, O = I> {
  /**
   * Returns the extended value type.
   */
  static typeOf = getValueType;

  /**
   * The human-readable shape description.
   */
  description = '';

  /**
   * The array of checks that were used to produce {@linkcode _applyChecks}.
   */
  protected _checks: readonly Check[] | null = null;

  /**
   * A callback that applies checks to the given value.
   */
  protected _applyChecks: ApplyChecksCallback | null = null;

  /**
   * `true` if some checks from {@linkcode _checks} were marked as unsafe, `false` otherwise.
   */
  protected _isUnsafe = false;

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
   * @returns The clone of the shape with the description added.
   */
  describe(text: string): this {
    const shape = cloneObject(this);
    shape.description = text;
    return shape;
  }

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode CheckOptions.key} is defined and there's already a check with the same key then the existing
   * check is deleted and the new one is appended. If the key is `undefined` then the `cb` identity is used as a key.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of the shape.
   */
  check(cb: CheckCallback<O>, options: CheckOptions = {}): this {
    const { key = cb, param, unsafe = false } = options;

    const check: Check = { key, callback: cb, param, unsafe };

    return this._replaceChecks(
      this._checks !== null ? this._checks.filter(check => check.key !== key).concat(check) : [check]
    );
  }

  /**
   * Returns the {@linkcode Check} by its key.
   *
   * @param key The check key.
   * @returns The check or `undefined` if there's no check associated with the key.
   */
  getCheck(key: unknown): Check | undefined {
    return this._checks?.find(check => check.key === key);
  }

  /**
   * Deletes the check from the shape.
   *
   * @param key The check key.
   * @returns The clone of the shape if the matching check was deleted, or this shape if there is no matching check.
   */
  deleteCheck(key: unknown): this {
    if (this.getCheck(key) === undefined) {
      return this;
    }
    return this._replaceChecks(this._checks!.filter(check => check.key !== key));
  }

  /**
   * Refines the shape output type with the
   * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
   *
   * @param predicate The predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The constraint options or an issue message.
   * @returns The shape with the narrowed output.
   * @template T The narrowed output value.
   */
  refine<T extends O>(
    /**
     * @param output The shape output value.
     */
    predicate: (output: O) => output is T,
    options?: RefineOptions | Message
  ): Shape<I, T>;

  /**
   * Checks that the output value conforms the predicate.
   *
   * @param predicate The predicate that returns truthy result if value is valid, or returns falsy result otherwise.
   * @param options The constraint options or an issue message.
   * @returns The clone of the shape.
   */
  refine(
    /**
     * @param output The shape output value.
     */
    predicate: (output: O) => boolean,
    options?: RefineOptions | Message
  ): this;

  refine(predicate: (output: O) => unknown, options?: RefineOptions | Message) {
    const issueFactory = createIssueFactory(CODE_PREDICATE, MESSAGE_PREDICATE, options, predicate);

    const cb: CheckCallback<O> = (input, options) => {
      if (!predicate(input)) {
        return issueFactory(input, options);
      }
    };

    const unsafe = options !== null && typeof options === 'object' && options.unsafe;

    return this.check(cb, { key: predicate, param: predicate, unsafe });
  }

  /**
   * Pipes the shape output to another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @returns The {@linkcode PipeShape} instance.
   * @template T The output value.
   */
  to<S extends AnyShape>(shape: S): PipeShape<this, S> {
    return new PipeShape(this, shape);
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
   * Returns an opaque shape that adds a brand to the output type.
   *
   * @returns A shape with the branded output type.
   * @template T The brand value.
   */
  brand<T = this>(): BrandShape<this, T> {
    return this as BrandShape<this, T>;
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
  replace<A extends Literal, B extends Literal>(inputValue: A, outputValue: B): ReplaceShape<this, A, B> {
    return new ReplaceShape(this, inputValue, outputValue);
  }

  /**
   * Input value is passed directly to the output without any checks.
   *
   * @param value The included value.
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode ReplaceShape} instance.
   * @template T The included value.
   */
  include<T extends Literal>(value: T, options?: ConstraintOptions | Message): IncludeShape<this, T> {
    return this.replace(value, value);
  }

  /**
   * Excludes value from both input and output.
   *
   * @param value The excluded value.
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode ExcludeShape} instance.
   * @template T The excluded value.
   */
  exclude<T extends Literal>(value: T, options?: ConstraintOptions | Message): ExcludeShape<this, T> {
    return new ExcludeShape(this, value, options);
  }

  /**
   * Replaces `undefined` input value with an `undefined` output value.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  optional(): IncludeShape<this, undefined>;

  /**
   * Replaces `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  optional<T extends Literal>(defaultValue: T): ReplaceShape<this, undefined, T>;

  optional(defaultValue?: any) {
    return this.replace(undefined, defaultValue);
  }

  /**
   * Replaces `null` input value with an `null` output value.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullable(): IncludeShape<this, null>;

  /**
   * Replaces `null` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `null`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullable<T extends Literal>(defaultValue: T): ReplaceShape<this, null, T>;

  nullable(defaultValue?: any) {
    return this.replace(null, arguments.length === 0 ? null : defaultValue);
  }

  /**
   * Passes `null` and `undefined` input values directly to the output without parsing.
   *
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullish(): IncludeShape<IncludeShape<this, null>, undefined>;

  /**
   * Replaces `null` and `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @returns The {@linkcode ReplaceShape} instance.
   */
  nullish<T extends Literal>(defaultValue?: T): ReplaceShape<ReplaceShape<this, null, T>, undefined, T>;

  nullish(defaultValue?: any) {
    return this.nullable(arguments.length === 0 ? null : defaultValue).optional(defaultValue);
  }

  /**
   * Prevents an input and output from being `undefined`.
   *
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  nonOptional(options?: ConstraintOptions | Message): ExcludeShape<this, undefined> {
    return this.exclude(undefined, options);
  }

  /**
   * Returns `undefined` if parsing fails.
   *
   * @returns The {@linkcode CatchShape} instance.
   */
  catch(): CatchShape<this, undefined>;

  /**
   * Returns the fallback value if parsing fails.
   *
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed.
   * @returns The {@linkcode CatchShape} instance.
   */
  catch<T extends Literal>(fallback: T | (() => T)): CatchShape<this, T>;

  catch(fallback?: unknown): Shape {
    return new CatchShape(this, fallback);
  }

  not<S extends AnyShape>(shape: S, options?: ConstraintOptions | Message): NotShape<this, S> {
    return new NotShape(this, shape, options);
  }

  /**
   * Returns a shape clone with new set of checks.
   *
   * @param checks The map from a check key to a corresponding check.
   * @returns The clone of the shape.
   */
  protected _replaceChecks(checks: readonly Check[]): this {
    const shape = cloneObject(this);

    shape._checks = checks.length !== 0 ? checks : null;
    shape._applyChecks = createApplyChecksCallback(checks);
    shape._isUnsafe = checks.some(isUnsafeCheck);

    return shape;
  }

  /**
   * Must return `true` if the shape must be used in async context only, otherwise the shape can be used in both sync
   * and async contexts. Override this method to implement a custom shape.
   */
  protected _isAsync(): boolean {
    return false;
  }

  /**
   * Returns the list of runtime value types that can be processed by the shape.
   *
   * Used for various optimizations. Elements of the returned array don't have to be unique.
   */
  protected _getInputTypes(): readonly ValueType[] {
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
}

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
   * The array of unique types that the shape supports as input values.
   */
  readonly inputTypes: readonly ValueType[];

  /**
   * `true` if the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called.
   * `false` if the shape can be used in both sync and async contexts.
   */
  readonly isAsync: boolean;

  /**
   * Synchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
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
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
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
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
   */
  parseOrDefault(input: unknown): O | undefined;

  /**
   * Synchronously parses the value and returns the default value if parsing fails.
   *
   * @param input The value to parse.
   * @param defaultValue The default value that is returned if parsing fails.
   * @param options Parsing options.
   * @returns The value that conforms the output type of the shape.
   * @throws `Error` if the shape doesn't support the sync parsing, see {@linkcode isAsync}.
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

Object.defineProperties(Shape.prototype, {
  input: {
    configurable: true,
    get() {
      throw new Error(ERROR_FORBIDDEN_AT_RUNTIME);
    },
  },

  output: {
    configurable: true,
    get() {
      throw new Error(ERROR_FORBIDDEN_AT_RUNTIME);
    },
  },

  inputTypes: {
    configurable: true,
    get(this: Shape) {
      let inputTypes = unique(this._getInputTypes()).slice(0);

      if (inputTypes.length === 0 || inputTypes.includes(TYPE_ANY)) {
        inputTypes = [TYPE_ANY];
      }
      if (inputTypes.length !== 1) {
        const neverIndex = inputTypes.indexOf(TYPE_NEVER);

        if (neverIndex !== -1) {
          inputTypes.splice(neverIndex, 1);
        }
      }

      Object.freeze(inputTypes);

      Object.defineProperty(this, 'inputTypes', { writable: true, value: inputTypes });

      return inputTypes;
    },
  },

  isAsync: {
    configurable: true,
    get(this: Shape) {
      const async = this._isAsync();
      const _applyAsync = Shape.prototype['_applyAsync'];

      if (async) {
        this._apply = () => {
          throw new Error(ERROR_REQUIRES_ASYNC);
        };
      } else if (this._applyAsync !== _applyAsync) {
        this._applyAsync = _applyAsync;
      }

      Object.defineProperty(this, 'isAsync', { writable: true, value: async });

      return async;
    },
  },

  try: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

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

      Object.defineProperty(this, 'try', { writable: true, value: cb });

      return cb;
    },
  },

  tryAsync: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

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

      Object.defineProperty(this, 'tryAsync', { writable: true, value: cb });

      return cb;
    },
  },

  parse: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

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

      Object.defineProperty(this, 'parse', { writable: true, value: cb });

      return cb;
    },
  },

  parseAsync: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

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

      Object.defineProperty(this, 'parseAsync', { writable: true, value: cb });

      return cb;
    },
  },

  parseOrDefault: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

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

      Object.defineProperty(this, 'parseOrDefault', { writable: true, value: cb });

      return cb;
    },
  },

  parseOrDefaultAsync: {
    configurable: true,
    get(this: Shape) {
      this.isAsync;

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

      Object.defineProperty(this, 'parseOrDefaultAsync', { writable: true, value: cb });

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
   * `true` if the promise returned from the {@linkcode callback} to be fulfilled before the transformation is
   * completed, or `false` if the value that is synchronously returned from the {@linkcode callback} is used as a
   * transformation output.
   */
  readonly isCallbackAsync: boolean;

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

    this.isCallbackAsync = async;
  }

  protected _isAsync(): boolean {
    return this.isCallbackAsync || this.shape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']();
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<O> {
    const { shape, callback, _applyChecks } = this;

    let issues = null;
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

    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && !isEqual(input, output)) {
      return ok(output);
    }
    return issues;
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
        let issues = null;

        if (
          (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) &&
          !isEqual(input, output)
        ) {
          return ok(output);
        }
        return issues;
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
export class PipeShape<I extends AnyShape, O extends Shape<I['output'], any>>
  extends Shape<I['input'], O['output']>
  implements DeepPartialProtocol<PipeShape<DeepPartialShape<I>, DeepPartialShape<O>>>
{
  /**
   * Creates the new {@linkcode PipeShape} instance.
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

  deepPartial(): PipeShape<DeepPartialShape<I>, DeepPartialShape<O>> {
    return copyUnsafeChecks(
      this,
      new PipeShape(toDeepPartialShape(this.inputShape), toDeepPartialShape(this.outputShape))
    );
  }

  protected _isAsync(): boolean {
    return this.inputShape.isAsync || this.outputShape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.inputShape.inputTypes;
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

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
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

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
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
export class ReplaceShape<S extends AnyShape, A, B>
  extends Shape<S['input'] | A, Exclude<S['output'], A> | B>
  implements DeepPartialProtocol<ReplaceShape<DeepPartialShape<S>, A, B>>
{
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

  deepPartial(): ReplaceShape<DeepPartialShape<S>, A, B> {
    return copyUnsafeChecks(this, new ReplaceShape(toDeepPartialShape(this.shape), this.inputValue, this.outputValue));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes.concat(getValueType(this.inputValue));
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']().concat(this.inputValue);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Exclude<S['output'], A> | B> {
    const result = isEqual(input, this.inputValue) ? this._result : this.shape['_apply'](input, options);

    return this._applyResult(result, input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<Exclude<S['output'], A> | B>> {
    if (isEqual(input, this.inputValue)) {
      return Promise.resolve(this._applyResult(this._result, input, options));
    }
    return this.shape['_applyAsync'](input, options).then(result => this._applyResult(result, input, options));
  }

  private _applyResult(
    result: ApplyResult,
    input: unknown,
    options: ParseOptions
  ): ApplyResult<Exclude<S['output'], A> | B> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}

/**
 * The shape that excludes a value from both input and output.
 *
 * @template S The base shape.
 * @template T The excluded value.
 */
export class ExcludeShape<S extends AnyShape, T>
  extends Shape<Exclude<S['input'], T>, Exclude<S['output'], T>>
  implements DeepPartialProtocol<ExcludeShape<DeepPartialShape<S>, T>>
{
  protected _options;
  protected _typeIssueFactory;

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
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_EXCLUSION, MESSAGE_EXCLUSION, options, excludedValue);
  }

  deepPartial(): ExcludeShape<DeepPartialShape<S>, T> {
    return copyUnsafeChecks(this, new ExcludeShape(toDeepPartialShape(this.shape), this.excludedValue, this._options));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']().filter(value => !isEqual(this.excludedValue, value));
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<Exclude<S['output'], T>> {
    if (isEqual(input, this.excludedValue)) {
      return this._typeIssueFactory(input, options);
    }
    return this._applyResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<Exclude<S['output'], T>>> {
    if (isEqual(input, this.excludedValue)) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }
    return this.shape['_applyAsync'](input, options).then(result => this._applyResult(result, input, options));
  }

  private _applyResult(
    result: ApplyResult,
    input: unknown,
    options: ParseOptions
  ): ApplyResult<Exclude<S['output'], T>> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;

      if (isEqual(output, this.excludedValue)) {
        return this._typeIssueFactory(input, options);
      }
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}

/**
 * The shape that returns the fallback value if parsing fails.
 *
 * @template S The shape that parses the input.
 */
export class CatchShape<S extends AnyShape, T>
  extends Shape<S['input'], S['output'] | T>
  implements DeepPartialProtocol<CatchShape<DeepPartialShape<S>, T>>
{
  private _resultProvider: () => Ok<T>;

  /**
   * Creates the new {@linkcode CatchShape} instance.
   *
   * @param shape The shape that parses the input.
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed.
   * @template S The shape that parses the input.
   */
  constructor(
    /**
     * The shape that parses the input.
     */
    readonly shape: S,
    /**
     * The value or a callback that returns a value that is returned if parsing has failed.
     */
    readonly fallback: T | (() => T)
  ) {
    super();

    if (typeof fallback === 'function') {
      this._resultProvider = () => ok((fallback as Function)());
    } else {
      const result = ok(fallback);
      this._resultProvider = () => result;
    }
  }

  deepPartial(): CatchShape<DeepPartialShape<S>, T> {
    return copyUnsafeChecks(this, new CatchShape(toDeepPartialShape(this.shape), this.fallback));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']();
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<S['output'] | T> {
    return this._applyResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output'] | T>> {
    return this.shape['_applyAsync'](input, options).then(result => this._applyResult(result, input, options));
  }

  private _applyResult(result: ApplyResult, input: unknown, options: ParseOptions): ApplyResult<S['output'] | T> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        result = this._resultProvider();
      }
      output = result.value;
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}

/**
 * Checks that the input doesn't match the shape.
 *
 * @template S The base shape.
 * @template N The shape to which the input must not conform.
 */
export class NotShape<S extends AnyShape, N extends AnyShape>
  extends Shape<S['input'], S['output']>
  implements DeepPartialProtocol<NotShape<DeepPartialShape<S>, N>>
{
  protected _options;
  protected _typeIssueFactory;

  constructor(readonly shape: S, readonly notShape: N, options?: ConstraintOptions | Message) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_NOT, MESSAGE_NOT, options, undefined);
  }

  deepPartial(): NotShape<DeepPartialShape<S>, N> {
    return copyUnsafeChecks(this, new NotShape(toDeepPartialShape(this.shape), this.notShape, this._options));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync || this.notShape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']();
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<S['output']> {
    const { shape, notShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = shape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (!isArray(notShape['_apply'](output, options))) {
      issues = this._typeIssueFactory(input, options);
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output']>> {
    const { shape, notShape, _applyChecks } = this;

    let result: ApplyResult = null;
    let output = input;

    return shape['_applyAsync'](input, options)
      .then(inputResult => {
        if (inputResult !== null) {
          if (isArray(inputResult)) {
            return inputResult;
          }
          result = inputResult;
          output = inputResult.value;
        }

        return notShape['_applyAsync'](output, options);
      })
      .then(outputResult => {
        let issues;

        if (!isArray(outputResult)) {
          issues = this._typeIssueFactory(input, options);
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
      });
  }
}
