import {
  CODE_DENIED,
  CODE_EXCLUDED,
  CODE_PREDICATE,
  ERROR_REQUIRES_ASYNC,
  MESSAGE_DENIED,
  MESSAGE_EXCLUDED,
  MESSAGE_PREDICATE,
} from '../constants';
import { getTypeOf, TYPE_UNKNOWN } from '../Type';
import {
  ApplyOptions,
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
} from '../types';
import {
  applyShape,
  captureIssues,
  cloneInstance,
  copyUnsafeChecks,
  createIssueFactory,
  deleteAt,
  getCheckIndex,
  getErrorMessage,
  isArray,
  isEqual,
  isObjectLike,
  isType,
  ok,
  ReadonlyDict,
  replaceChecks,
  returnTrue,
  toDeepPartialShape,
  unionTypes,
} from '../utils';
import { ValidationError } from '../ValidationError';

/**
 * The marker object that is used to denote an impossible value. For example, `NEVER` is returned from `_coerce`
 * method, that is present on various shapes, when coercion is not possible.
 */
export const NEVER = Object.freeze({}) as never;

export const defaultApplyOptions = Object.freeze<ApplyOptions>({ verbose: false, coerced: false });

/**
 * Excludes `U` from `T` only if `U` is a literal type.
 */
// prettier-ignore
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
 * @template T The value that is allowed as an input and output.
 */
export type AllowLiteralShape<S extends AnyShape, T> = ReplaceLiteralShape<S, T, T>;

/**
 * An alias for {@linkcode ExcludeShape} that doesn't impose the type exclusion.
 *
 * @template S The base shape.
 * @template N The shape to which the output must not conform.
 */
export interface NotShape<S extends AnyShape, N extends AnyShape>
  extends Shape<S[INPUT], S[OUTPUT]>,
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
 * This symbol doesn't exist at runtime!
 *
 * The ephemeral unique symbol that is used for type branding by {@linkcode Branded}.
 */
declare const BRAND: unique symbol;

/**
 * The branded type.
 *
 * @template T The base type.
 * @template B The brand value.
 */
export type Branded<T, B> = T & { [BRAND]: B };

/**
 * The shape that adds a brand to the output type. This shape doesn't affect the runtime and is used for emulation of
 * nominal typing.
 *
 * @template S The shape which output must be branded.
 * @template B The brand value.
 */
// prettier-ignore
export type BrandShape<S extends AnyShape & Partial<DeepPartialProtocol<AnyShape>>, B> =
  & Shape<S[INPUT], Branded<S[OUTPUT], B>>
  & Pick<S, keyof DeepPartialProtocol<AnyShape>>;

/**
 * A shape should implement {@linkcode DeepPartialProtocol} to support conversion to a deep partial alternative.
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
 * The result that shape returns after being applied to an input value. This is the part of the internal API required
 * for creating custom shapes.
 */
export type Result<T = any> = Ok<T> | Issue[] | null;

/**
 * The callback to which shape checks are compiled, see {@linkcode Shape._applyChecks}.
 */
export type ApplyChecksCallback = (output: any, issues: Issue[] | null, options: ApplyOptions) => Issue[] | null;

export type INPUT = '__input';
export type OUTPUT = '__output';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

/**
 * Extracts the shape input type.
 *
 * @template S The shape from which the input type must be inferred.
 */
export type Input<S extends AnyShape> = S[INPUT];

/**
 * Extracts the shape output type.
 *
 * @template S The shape from which the output type must be inferred.
 */
export type Output<S extends AnyShape> = S[OUTPUT];

/**
 * The baseline shape implementation.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class Shape<I = any, O = I> {
  /**
   * The shape input type.
   *
   * @internal
   */
  declare readonly [INPUT]: I;

  /**
   * The shape output type.
   *
   * @internal
   */
  declare readonly [OUTPUT]: O;

  /**
   * The dictionary of shape annotations. Use {@linkcode annotate} to add new annotations via DSL.
   */
  annotations: Dict = {};

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
   * Returns `true` if the shape accepts given input type or value, or `false` otherwise.
   *
   * @param input The type or value that must be checked.
   */
  accepts(input: unknown): boolean {
    const { inputs } = this;

    return inputs.includes(TYPE_UNKNOWN) || inputs.includes(input) || inputs.includes(getTypeOf(input));
  }

  /**
   * Assigns annotations to the shape.
   *
   * @param annotations Annotations to add.
   * @returns The clone of the shape with the updated annotations.
   */
  annotate(annotations: ReadonlyDict): this {
    const shape = this._clone();
    shape.annotations = Object.assign({}, this.annotations, annotations);
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
   * @template P The check param.
   */
  check<P>(cb: CheckCallback<O, P>, options: CheckOptions & { param: P }): this;

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
  check(cb: CheckCallback<O>, options?: CheckOptions): this;

  check(cb: CheckCallback, options: CheckOptions = {}): this {
    const { key = cb, param, unsafe = false } = options;

    const index = getCheckIndex(this._checks, key);
    const checks = this._checks.concat({ key, callback: cb, param, isUnsafe: unsafe });

    return replaceChecks(this._clone(), deleteAt(checks, index));
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

    return index !== -1 ? replaceChecks(this._clone(), deleteAt(this._checks.slice(0), index)) : this;
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
     * @param options Parsing options.
     * @return `true` if value matches the predicate, or `false` otherwise.
     * @throws {@linkcode ValidationError} to notify that the refinement cannot be completed.
     */
    cb: (output: O, options: Readonly<ApplyOptions>) => output is T,
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
     * @param options Parsing options.
     * @return `true` if value matches the predicate, or `false` otherwise.
     * @throws {@linkcode ValidationError} to notify that the refinement cannot be completed.
     */
    cb: (output: O, options: Readonly<ApplyOptions>) => boolean,
    options?: RefineOptions | Message
  ): this;

  refine(cb: (output: O, options: Readonly<ApplyOptions>) => unknown, options?: RefineOptions | Message) {
    const { key = cb, code = CODE_PREDICATE, unsafe = false } = isObjectLike<RefineOptions>(options) ? options : {};

    const issueFactory = createIssueFactory(code, MESSAGE_PREDICATE, options, cb);

    return this.check(
      (input, param, options) => {
        if (!cb(input, options)) {
          return issueFactory(input, options);
        }
      },
      { key, param: cb, unsafe }
    );
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
    cb: (output: O, options: Readonly<ApplyOptions>) => T
  ): Shape<I, T> {
    return this.to(new TransformShape(cb));
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
    cb: (output: O, options: Readonly<ApplyOptions>) => Promise<T>
  ): Shape<I, T> {
    return this.to(new TransformShape(cb, true));
  }

  /**
   * Returns an opaque shape that adds a brand to the output type.
   *
   * @returns A shape with the branded output type.
   * @template B The brand value.
   */
  brand<B = this>(): BrandShape<this, B> {
    return this as BrandShape<this, B>;
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
   * Allows a literal input value, so it is passed directly to the output without any checks.
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
   * receives an input value, an array of raised issues, and {@link ApplyOptions parsing options}.
   * @returns The {@linkcode CatchShape} instance.
   */
  catch<T extends Literal>(
    fallback: T | ((input: any, issues: Issue[], options: Readonly<ApplyOptions>) => T)
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
   * Returns input types and literal values that this shape can accept as an input.
   */
  protected _getInputs(): unknown[] {
    return [TYPE_UNKNOWN];
  }

  /**
   * Clones the shape.
   */
  protected _clone(): this {
    return cloneInstance(this);
  }

  /**
   * Synchronously parses the input.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  protected _apply(input: unknown, options: ApplyOptions): Result<O> {
    const { _applyChecks } = this;

    if (_applyChecks !== null) {
      return _applyChecks(input, null, options);
    }
    return null;
  }

  /**
   * Asynchronously parses the input.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<O>> {
    return new Promise(resolve => resolve(this._apply(input, options)));
  }
}

export interface Shape<I, O> {
  /**
   * The array of unique input types and values that are accepted by the shape.
   */
  readonly inputs: readonly unknown[];

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
  try(input: unknown, options?: ApplyOptions): Ok<O> | Err;

  /**
   * Asynchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   */
  tryAsync(input: unknown, options?: ApplyOptions): Promise<Ok<O> | Err>;

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
  parseOrDefault<T>(input: unknown, defaultValue: T, options?: ApplyOptions): O | T;

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
  parseOrDefaultAsync<T>(input: unknown, defaultValue: T, options?: ApplyOptions): Promise<O | T>;
}

Object.defineProperties(Shape.prototype, {
  inputs: {
    configurable: true,

    get(this: Shape) {
      Object.defineProperty(this, 'inputs', { configurable: true, value: [] });

      const inputs = Object.freeze(unionTypes(this['_getInputs']()));

      Object.defineProperty(this, 'inputs', { configurable: true, value: inputs });

      return inputs;
    },
  },

  isAsync: {
    configurable: true,

    get(this: Shape) {
      Object.defineProperty(this, 'isAsync', { configurable: true, value: false });

      const async = this._isAsync();
      const _defaultApplyAsync = Shape.prototype['_applyAsync'];

      if (async) {
        this._apply = () => {
          throw new Error(ERROR_REQUIRES_ASYNC);
        };
      } else if (this._applyAsync !== _defaultApplyAsync) {
        this._applyAsync = _defaultApplyAsync;
      }

      Object.defineProperty(this, 'isAsync', { configurable: true, value: async });

      return async;
    },
  },

  try: {
    configurable: true,

    get(this: Shape) {
      this.isAsync;

      const cb: Shape['try'] = (input, options) => {
        const result = this._apply(input, options || defaultApplyOptions);

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
        return this._applyAsync(input, options || defaultApplyOptions).then(result => {
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
        const result = this._apply(input, options || defaultApplyOptions);

        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          throw new ValidationError(result, getErrorMessage(result, input, options));
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
        return this._applyAsync(input, options || defaultApplyOptions).then(result => {
          if (result === null) {
            return input;
          }
          if (isArray(result)) {
            throw new ValidationError(result, getErrorMessage(result, input, options));
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

      const cb: Shape['parseOrDefault'] = (input: unknown, defaultValue?: unknown, options?: ApplyOptions) => {
        const result = this._apply(input, options || defaultApplyOptions);

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

      const cb: Shape['parseOrDefaultAsync'] = (input: unknown, defaultValue?: unknown, options?: ApplyOptions) => {
        return this._applyAsync(input, options || defaultApplyOptions).then(result => {
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
 * The shape that applies a transformer callback to the input.
 *
 * @template T The output value.
 */
export class TransformShape<T> extends Shape<any, T> {
  /**
   * Creates the new {@linkcode TransformShape} instance.
   *
   * @param callback The callback that transforms the input value.
   * @param async If `true` then the transform shape waits for the promise returned from the callback to be
   * fulfilled. Otherwise, the value that is synchronously returned from the callback is used as an output.
   * @template T The output value.
   */
  constructor(
    /**
     * The callback that transforms the input value.
     *
     * @param value The input value.
     * @param options Parsing options.
     * @return The transformation result.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    readonly callback: (value: any, options: Readonly<ApplyOptions>) => PromiseLike<T> | T,
    async?: boolean
  ) {
    super();

    if (async) {
      this._isAsync = returnTrue;
    }
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<T> {
    const { callback, _applyChecks } = this;

    let issues = null;
    let output;

    try {
      output = callback(input, options) as T;
    } catch (error) {
      return captureIssues(error);
    }

    if ((_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) && !isEqual(input, output)) {
      return ok(output);
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<T>> {
    const { _applyChecks } = this;

    return new Promise<T>(resolve => resolve(this.callback(input, options))).then(output => {
      let issues = null;

      if (
        (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) &&
        !isEqual(input, output)
      ) {
        return ok(output);
      }
      return issues;
    }, captureIssues);
  }
}

/**
 * The shape that parses the output of the input shape with the output shape.
 *
 * @template I The input shape.
 * @template O The output shape.
 */
export class PipeShape<I extends AnyShape, O extends AnyShape>
  extends Shape<I[INPUT], O[OUTPUT]>
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

  protected _getInputs(): unknown[] {
    return this.inputShape.inputs.slice(0);
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<O[OUTPUT]> {
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

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<O[OUTPUT]>> {
    const { inputShape, outputShape, _applyChecks } = this;

    return inputShape['_applyAsync'](input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyShape(outputShape, output, options, outputResult => {
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
  extends Shape<S[INPUT] | A, ExcludeLiteral<S[OUTPUT], A> | B>
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

  protected _getInputs(): unknown[] {
    return this.shape.inputs.concat(this.inputValue);
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<ExcludeLiteral<S[OUTPUT], A> | B> {
    const result = isEqual(input, this.inputValue) ? this._result : this.shape['_apply'](input, options);

    return this._handleResult(result, input, options);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<ExcludeLiteral<S[OUTPUT], A> | B>> {
    if (isEqual(input, this.inputValue)) {
      return Promise.resolve(this._handleResult(this._result, input, options));
    }
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(
    result: Result,
    input: unknown,
    options: ApplyOptions
  ): Result<ExcludeLiteral<S[OUTPUT], A> | B> {
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
  extends Shape<ExcludeLiteral<S[INPUT], T>, ExcludeLiteral<S[OUTPUT], T>>
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

  protected _getInputs(): unknown[] {
    return this.shape.inputs.filter(input => !isEqual(this.deniedValue, input));
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<ExcludeLiteral<S[OUTPUT], T>> {
    if (isEqual(input, this.deniedValue)) {
      return this._typeIssueFactory(input, options);
    }
    return this._handleResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<ExcludeLiteral<S[OUTPUT], T>>> {
    if (isEqual(input, this.deniedValue)) {
      return Promise.resolve(this._typeIssueFactory(input, options));
    }
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(result: Result, input: unknown, options: ApplyOptions): Result<ExcludeLiteral<S[OUTPUT], T>> {
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
  extends Shape<S[INPUT], S[OUTPUT] | T>
  implements DeepPartialProtocol<CatchShape<DeepPartialShape<S>, T>>
{
  private _resultProvider: (input: unknown, issues: Issue[], options: Readonly<ApplyOptions>) => Ok<T>;

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
     *  A callback receives an input value, an array of raised issues, and {@link ApplyOptions parsing options}.
     */
    readonly fallback: T | ((input: any, issues: Issue[], options: Readonly<ApplyOptions>) => T)
  ) {
    super();

    if (typeof fallback === 'function') {
      this._resultProvider = (input, issues, options) => ok((fallback as Function)(input, issues, options));
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

  protected _getInputs(): unknown[] {
    return this.shape.inputs.slice(0);
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<S[OUTPUT] | T> {
    return this._handleResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<S[OUTPUT] | T>> {
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(result: Result, input: unknown, options: ApplyOptions): Result<S[OUTPUT] | T> {
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
  extends Shape<S[INPUT], Exclude<S[OUTPUT], N[INPUT]>>
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

  protected _getInputs(): unknown[] {
    return this.shape.inputs.filter(input => isType(input) || !this.excludedShape.inputs.includes(input));
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<Exclude<S[OUTPUT], N[INPUT]>> {
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

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<Exclude<S[OUTPUT], N[INPUT]>>> {
    const { shape, excludedShape, _applyChecks } = this;

    return shape['_applyAsync'](input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return applyShape(excludedShape, output, options, outputResult => {
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
