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
  applyForResult,
  captureIssues,
  cloneInstance,
  copyUnsafeChecks,
  createIssueFactory,
  deleteAt,
  getCheckIndex,
  getValueType,
  isArray,
  isEqual,
  isFunction,
  isObjectLike,
  ok,
  replaceChecks,
  toDeepPartialShape,
  unique,
} from '../utils';
import { ValidationError } from '../ValidationError';
import {
  CODE_DENIED,
  CODE_EXCLUDED,
  CODE_PREDICATE,
  ERROR_FORBIDDEN_AT_RUNTIME,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_DENIED,
  MESSAGE_EXCLUDED,
  MESSAGE_PREDICATE,
  TYPE_ANY,
  TYPE_NEVER,
} from '../constants';

/**
 * The marker object that is used to denote an impossible value. For example, `NEVER` is returned from `_coerce`
 * method, that is present on various shapes, when coercion is not possible.
 */
export const NEVER = Object.freeze({ never: true }) as never;

export const defaultParseOptions = Object.freeze<ParseOptions>({ verbose: false, coerced: false });

// prettier-ignore
/**
 * Excludes `U` from `T` only if `U` is a literal type.
 */
export type ExcludeLiteral<T, U> =
  number extends U ? T :
  string extends U ? T :
  symbol extends U ? T :
  bigint extends U ? T :
  object extends U ? T :
  boolean extends U ? T :
  Exclude<T, U>;

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

/**
 * An alias for {@linkcode ReplaceLiteralShape} that allows the same value as both an input and an output.
 *
 * @template S The shape that parses the input without the replaced value.
 * @template T The value that is allows as an input and output.
 */
export type AllowLiteralShape<S extends AnyShape, T> = ReplaceLiteralShape<S, T, T>;

/**
 * An alias for {@linkcode ExcludeShape} that doesn't impose the type exclusion.
 *
 * @template S The base shape.
 * @template N The shape to which the output must not conform.
 */
export interface NotShape<S extends AnyShape, N extends AnyShape>
  extends Shape<S['input'], S['output']>,
    DeepPartialProtocol<NotShape<DeepPartialShape<S>, N>> {
  /**
   * The base shape.
   */
  readonly shape: S;

  /**
   * The shape to which the output must not conform.
   */
  readonly excludedShape: N;
}

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
export type OptionalDeepPartialShape<S extends AnyShape> = AllowLiteralShape<DeepPartialShape<S>, undefined>;

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
 * The result that shape returns after being applied to an input value. This is the part of the internal API required
 * for creating custom shapes.
 */
export type Result<T = any> = Ok<T> | Issue[] | null;

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
  protected _checks: readonly Check[] = [];

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
   * Returns `true` if the shape accepts the given input type, or `false` otherwise.
   *
   * @param type The type that must be checked.
   */
  isAcceptedType(type: ValueType): boolean {
    const types = this.inputTypes;

    return types[0] === TYPE_ANY || (types[0] !== TYPE_NEVER && type === TYPE_ANY) || types.includes(type);
  }

  /**
   * Adds a human-readable description text to the shape.
   *
   * @param text The description text.
   * @returns The clone of the shape with the description added.
   */
  describe(text: string): this {
    const shape = cloneInstance(this);
    shape.description = text;
    return shape;
  }

  /**
   * Adds the check that is applied to the shape output.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @returns The clone of the shape.
   */
  check(cb: CheckCallback<O, undefined>): this;

  /**
   * Adds the check that is applied to the shape output.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param cb The callback that checks the shape output.
   * @param param The param that is passed to `cb` as the second argument.
   * @returns The clone of the shape.
   */
  check<P>(cb: CheckCallback<O, P>, param: P): this;

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode CheckOptions.key} is defined and there's already a check with the same key then the existing
   * check is deleted and the new one is appended. If the key is `undefined` then the `cb` identity is used as a key.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param options The check options.
   * @param cb The callback that checks the shape output.
   * @returns The clone of the shape.
   */
  check(options: CheckOptions, cb: CheckCallback<O, undefined>): this;

  /**
   * Adds the check that is applied to the shape output.
   *
   * If the {@linkcode CheckOptions.key} is defined and there's already a check with the same key then the existing
   * check is deleted and the new one is appended. If the key is `undefined` then the `cb` identity is used as a key.
   *
   * If check callback returns an empty array, it is considered that no issues have occurred.
   *
   * @param options The check options.
   * @param cb The callback that checks the shape output.
   * @param param The param that is passed to `cb` as the second argument.
   * @returns The clone of the shape.
   */
  check<P>(options: CheckOptions, cb: CheckCallback<O, P>, param: P): this;

  check(options: any, cb?: any, param?: any): this {
    if (isFunction(options)) {
      param = cb;
      cb = options;
      options = {};
    }

    const { key = cb, unsafe = false } = options;

    const index = getCheckIndex(this._checks, key);
    const checks = this._checks.concat({ key, callback: cb, param, isUnsafe: unsafe });

    return replaceChecks(cloneInstance(this), index !== -1 ? deleteAt(checks, index) : checks);
  }

  /**
   * Returns the {@linkcode Check} by its key.
   *
   * @param key The check key.
   * @returns The check or `undefined` if there's no check associated with the key.
   */
  getCheck(key: unknown): Check | undefined {
    const index = getCheckIndex(this._checks, key);

    return index !== -1 ? this._checks[index] : undefined;
  }

  /**
   * Returns `true` if the shape has the check with the given key, or `false` otherwise.
   *
   * @param key The check key.
   */
  hasCheck(key: unknown): boolean {
    return getCheckIndex(this._checks, key) !== -1;
  }

  /**
   * Deletes the check from the shape.
   *
   * @param key The check key.
   * @returns The clone of the shape if the matching check was deleted, or this shape if there is no matching check.
   */
  deleteCheck(key: unknown): this {
    const index = getCheckIndex(this._checks, key);

    return index !== -1 ? replaceChecks(cloneInstance(this), deleteAt(this._checks.slice(0), index)) : this;
  }

  /**
   * Refines the shape output type with the
   * [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
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
   * @returns The clone of the shape.
   */
  refine(
    /**
     * @param output The shape output value.
     */
    cb: (output: O) => boolean,
    options?: RefineOptions | Message
  ): this;

  refine(cb: (output: O) => unknown, options?: any) {
    const issueFactory = createIssueFactory(CODE_PREDICATE, MESSAGE_PREDICATE, options, cb);

    return this.check({ key: cb, unsafe: isObjectLike(options) && options.unsafe }, (input, param, options) => {
      if (!cb(input)) {
        return issueFactory(input, options);
      }
    });
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
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   * @template A The input value to replace.
   * @template B The output value.
   */
  replace<A extends Literal, B extends Literal>(inputValue: A, outputValue: B): ReplaceLiteralShape<this, A, B> {
    return new ReplaceLiteralShape(this, inputValue, outputValue);
  }

  /**
   * Input value is passed directly to the output without any checks.
   *
   * @param value The included value.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   * @template T The included value.
   */
  allow<T extends Literal>(value: T): AllowLiteralShape<this, T> {
    return this.replace(value, value);
  }

  /**
   * Excludes value from both input and output.
   *
   * @param value The excluded value.
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode DenyLiteralShape} instance.
   * @template T The excluded value.
   */
  deny<T extends I | O>(value: T, options?: ConstraintOptions | Message): DenyLiteralShape<this, T> {
    return new DenyLiteralShape(this, value, options);
  }

  /**
   * Replaces `undefined` input value with an `undefined` output value.
   *
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  optional(): AllowLiteralShape<this, undefined>;

  /**
   * Replaces `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  optional<T extends Literal>(defaultValue: T): ReplaceLiteralShape<this, undefined, T>;

  optional(defaultValue?: any) {
    return this.replace(undefined, defaultValue);
  }

  /**
   * Replaces `null` input value with an `null` output value.
   *
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullable(): AllowLiteralShape<this, null>;

  /**
   * Replaces `null` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `null`.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullable<T extends Literal>(defaultValue: T): ReplaceLiteralShape<this, null, T>;

  nullable(defaultValue?: any) {
    return this.replace(null, arguments.length === 0 ? null : defaultValue);
  }

  /**
   * Passes `null` and `undefined` input values directly to the output without parsing.
   *
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullish(): AllowLiteralShape<AllowLiteralShape<this, null>, undefined>;

  /**
   * Replaces `null` and `undefined` input value with a default output value.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @returns The {@linkcode ReplaceLiteralShape} instance.
   */
  nullish<T extends Literal>(defaultValue?: T): ReplaceLiteralShape<ReplaceLiteralShape<this, null, T>, undefined, T>;

  nullish(defaultValue?: any) {
    return this.nullable(arguments.length === 0 ? null : defaultValue).optional(defaultValue);
  }

  /**
   * Prevents an input and output from being `undefined`.
   *
   * @param options The constraint options or an issue message.
   * @returns The {@linkcode DenyLiteralShape} instance.
   */
  nonOptional(options?: ConstraintOptions | Message): DenyLiteralShape<this, undefined> {
    return new DenyLiteralShape(this, undefined, options);
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
   * @param fallback The value or a callback that returns a value that is returned if parsing has failed. A callback
   * receives an input value, an array of raised issues, and {@link ParseOptions parsing options}.
   * @returns The {@linkcode CatchShape} instance.
   */
  catch<T extends Literal>(
    fallback: T | ((input: any, issues: Issue[], options: Readonly<ParseOptions>) => T)
  ): CatchShape<this, T>;

  catch(fallback?: unknown): Shape {
    return new CatchShape(this, fallback);
  }

  /**
   * Checks that the input doesn't match the shape.
   *
   * @param shape The shape to which the output must not conform.
   * @param options The constraint options or an issue message.
   * @template S The shape to which the output must not conform.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  exclude<S extends AnyShape>(shape: S, options?: ConstraintOptions | Message): ExcludeShape<this, S> {
    return new ExcludeShape(this, shape, options);
  }

  /**
   * Checks that the input doesn't match the shape.
   *
   * This method works exactly as {@linkcode exclude} at runtime, but it doesn't perform the exclusion on the type
   * level.
   *
   * @param shape The shape to which the output must not conform.
   * @param options The constraint options or an issue message.
   * @template S The shape to which the output must not conform.
   * @returns The {@linkcode ExcludeShape} instance.
   */
  not<S extends AnyShape>(shape: S, options?: ConstraintOptions | Message): NotShape<this, S> {
    return this.exclude(shape, options);
  }

  /**
   * Must return `true` if the shape must be used in async context only, otherwise the shape can be used in both sync
   * and async contexts. Override this method to implement a custom shape.
   */
  protected _isAsync(): boolean {
    return false;
  }

  /**
   * Returns the array of runtime value types that can be processed by the shape.
   *
   * Used for various optimizations. Elements of the returned array don't have to be unique.
   */
  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_ANY];
  }

  /**
   * Returns the array of all input values that are known beforehand.
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
  protected _apply(input: unknown, options: ParseOptions): Result<O> {
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
  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<O>> {
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
      let types = unique(this._getInputTypes());

      if (types.length === 0 || types.includes(TYPE_ANY)) {
        types = [TYPE_ANY];
      }
      if (types.length !== 1) {
        const neverIndex = types.indexOf(TYPE_NEVER);

        if (neverIndex !== -1) {
          (types = types.slice(0)).splice(neverIndex, 1);
        }
      }

      Object.freeze(types);

      Object.defineProperty(this, 'inputTypes', { writable: true, value: types });

      return types;
    },
  },

  isAsync: {
    configurable: true,

    get(this: Shape) {
      const async = this._isAsync();
      const _defaultApplyAsync = Shape.prototype['_applyAsync'];

      if (async) {
        this._apply = () => {
          throw new Error(ERROR_REQUIRES_ASYNC);
        };
      } else if (this._applyAsync !== _defaultApplyAsync) {
        this._applyAsync = _defaultApplyAsync;
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
        return this._applyAsync(input, options || defaultParseOptions).then(result => {
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
        return this._applyAsync(input, options || defaultParseOptions).then(result => {
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
        return this._applyAsync(input, options || defaultParseOptions).then(result => {
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
   * `true` if the promise returned from the {@linkcode callback} must be fulfilled before the transformation is
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
    readonly callback: (output: S['output'], options: Readonly<ParseOptions>) => PromiseLike<O> | O
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

  protected _apply(input: any, options: ParseOptions): Result<O> {
    const { callback, _applyChecks } = this;

    let issues = null;
    let output = input;

    const result = this.shape['_apply'](input, options);

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

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<O>> {
    return new Promise(resolve => {
      const { callback, _applyChecks } = this;

      resolve(
        applyForResult(this.shape, input, options, result => {
          let output = input;

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

          const handleOutput = (output: unknown): Result => {
            let issues = null;

            if (
              (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) &&
              !isEqual(input, output)
            ) {
              return ok(output);
            }
            return issues;
          };

          if (this.isCallbackAsync) {
            return Promise.resolve(output).then(handleOutput, captureIssues);
          }

          return handleOutput(output);
        })
      );
    });
  }
}

/**
 * The shape that parses the output of the input shape with the output shape.
 *
 * @template I The input shape.
 * @template O The output shape.
 */
export class PipeShape<I extends AnyShape, O extends AnyShape>
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

  protected _apply(input: unknown, options: ParseOptions): Result<O['output']> {
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

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<O['output']>> {
    const { inputShape, outputShape, _applyChecks } = this;

    return inputShape['_applyAsync'](input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyForResult(outputShape, output, options, outputResult => {
        let issues;

        if (outputResult !== null) {
          if (isArray(outputResult)) {
            return outputResult;
          }
          output = outputResult.value;
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
      });
    });
  }
}

/**
 * The shape that replaces an input literal value with an output literal value.
 *
 * @template S The shape that parses the input without the replaced value.
 * @template A The input value to replace.
 * @template B The output value.
 */
export class ReplaceLiteralShape<S extends AnyShape, A, B>
  extends Shape<S['input'] | A, ExcludeLiteral<S['output'], A> | B>
  implements DeepPartialProtocol<ReplaceLiteralShape<DeepPartialShape<S>, A, B>>
{
  private _result: Result<B>;

  /**
   * Creates the new {@linkcode ReplaceLiteralShape} instance.
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

  deepPartial(): ReplaceLiteralShape<DeepPartialShape<S>, A, B> {
    return copyUnsafeChecks(
      this,
      new ReplaceLiteralShape(toDeepPartialShape(this.shape), this.inputValue, this.outputValue)
    );
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

  protected _apply(input: unknown, options: ParseOptions): Result<ExcludeLiteral<S['output'], A> | B> {
    const result = isEqual(input, this.inputValue) ? this._result : this.shape['_apply'](input, options);

    return this._handleResult(result, input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<ExcludeLiteral<S['output'], A> | B>> {
    if (isEqual(input, this.inputValue)) {
      return Promise.resolve(this._handleResult(this._result, input, options));
    }
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ParseOptions
  ): Result<ExcludeLiteral<S['output'], A> | B> {
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
 * The shape that prevents both input and output from being equal to a denied literal value.
 *
 * @template S The shape that parses the input without the denied value.
 * @template T The denied value.
 */
export class DenyLiteralShape<S extends AnyShape, T>
  extends Shape<ExcludeLiteral<S['input'], T>, ExcludeLiteral<S['output'], T>>
  implements DeepPartialProtocol<DenyLiteralShape<DeepPartialShape<S>, T>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates the new {@linkcode DenyLiteralShape} instance.
   *
   * @param shape The shape that parses the input without the denied value.
   * @param deniedValue The dined value.
   * @param options The constraint options or an issue message.
   * @template S The shape that parses the input without the denied value.
   * @template T The dined value.
   */
  constructor(
    /**
     * The shape that parses the input without the denied value.
     */
    readonly shape: S,
    /**
     * The dined value.
     */
    readonly deniedValue: T,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_DENIED, MESSAGE_DENIED, options, deniedValue);
  }

  deepPartial(): DenyLiteralShape<DeepPartialShape<S>, T> {
    return copyUnsafeChecks(
      this,
      new DenyLiteralShape(toDeepPartialShape(this.shape), this.deniedValue, this._options)
    );
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']().filter(value => !isEqual(this.deniedValue, value));
  }

  protected _apply(input: unknown, options: ParseOptions): Result<ExcludeLiteral<S['output'], T>> {
    if (isEqual(input, this.deniedValue)) {
      return this._typeIssueFactory(input, options);
    }
    return this._handleResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<ExcludeLiteral<S['output'], T>>> {
    if (isEqual(input, this.deniedValue)) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(result: Result, input: unknown, options: ParseOptions): Result<ExcludeLiteral<S['output'], T>> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;

      if (isEqual(output, this.deniedValue)) {
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
  private _resultProvider: (input: unknown, issues: Issue[], options: Readonly<ParseOptions>) => Ok<T>;

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
     *
     *  A callback receives an input value, an array of raised issues, and {@link ParseOptions parsing options}.
     */
    readonly fallback: T | ((input: any, issues: Issue[], options: Readonly<ParseOptions>) => T)
  ) {
    super();

    if (isFunction(fallback)) {
      this._resultProvider = (input, issues, options) => ok(fallback(input, issues, options));
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

  protected _apply(input: unknown, options: ParseOptions): Result<S['output'] | T> {
    return this._handleResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<S['output'] | T>> {
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(result: Result, input: unknown, options: ParseOptions): Result<S['output'] | T> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    if (result !== null) {
      if (isArray(result)) {
        try {
          result = this._resultProvider(input, result, options);
        } catch (error) {
          return captureIssues(error);
        }
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
 * @template N The shape to which the output must not conform.
 */
export class ExcludeShape<S extends AnyShape, N extends AnyShape>
  extends Shape<S['input'], Exclude<S['output'], N['input']>>
  implements DeepPartialProtocol<ExcludeShape<DeepPartialShape<S>, N>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates the new {@linkcode ExcludeShape} instance.
   *
   * @param shape The shape that parses the input.
   * @param excludedShape The shape to which the output must not conform.
   * @param options The constraint options or an issue message.
   * @template S The base shape.
   * @template N The shape to which the output must not conform.
   */
  constructor(
    /**
     * The base shape.
     */
    readonly shape: S,
    /**
     * The shape to which the output must not conform.
     */
    readonly excludedShape: N,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_EXCLUDED, MESSAGE_EXCLUDED, options, excludedShape);
  }

  deepPartial(): ExcludeShape<DeepPartialShape<S>, N> {
    return copyUnsafeChecks(this, new ExcludeShape(toDeepPartialShape(this.shape), this.excludedShape, this._options));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync || this.excludedShape.isAsync;
  }

  protected _getInputTypes(): readonly ValueType[] {
    return this.shape.inputTypes;
  }

  protected _getInputValues(): unknown[] {
    return this.shape['_getInputValues']();
  }

  protected _apply(input: unknown, options: ParseOptions): Result<Exclude<S['output'], N['input']>> {
    const { shape, excludedShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = shape['_apply'](input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (!isArray(excludedShape['_apply'](output, options))) {
      return this._typeIssueFactory(input, options);
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<Exclude<S['output'], N['input']>>> {
    const { shape, excludedShape, _applyChecks } = this;

    return shape['_applyAsync'](input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyForResult(excludedShape, output, options, outputResult => {
        let issues;

        if (!isArray(outputResult)) {
          return this._typeIssueFactory(input, options);
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
      });
    });
  }
}
