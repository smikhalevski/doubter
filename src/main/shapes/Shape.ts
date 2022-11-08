import {
  ApplyResult,
  Check,
  CheckCallback,
  CheckOptions,
  Err,
  Message,
  Ok,
  ParseOptions,
  RefineOptions,
} from '../shared-types';
import { ApplyChecksCallback, createApplyChecksCallback } from './createApplyChecksCallback';
import { addCheck, captureIssues, createIssueFactory, isArray, isEqual, ok } from '../utils';
import { ValidationError } from '../ValidationError';
import { CODE_PREDICATE, MESSAGE_PREDICATE } from './constants';

const defaultParseOptions: ParseOptions = Object.freeze({ verbose: false });

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

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
   * @throws `Error` if the shape doesn't support the synchronous parsing, see {@linkcode async}.
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
   * @throws `Error` if the shape doesn't support the synchronous parsing, see {@linkcode async}.
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
}

/**
 * The base shape.
 *
 * @template I The input value.
 * @template O The output value.
 */
export class Shape<I = any, O = I> {
  /**
   * The list of checks applied to the shape output.
   */
  checks: readonly Readonly<Check>[] = [];

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
   * @param async If `true` then the shape would allow only {@linkcode parseAsync} and throw an error if
   * {@linkcode parse} is called. Otherwise, shape can be used in both sync and async contexts.
   *
   * @template I The input value.
   * @template O The output value.
   */
  constructor(
    /**
     * `true` if the shape allows only {@linkcode parseAsync} and throws an error if {@linkcode parse} is called.
     * `false` if the shape can be used in both sync and async contexts.
     */
    readonly async = false
  ) {
    if (async) {
      this.apply = () => {
        throw new Error('Shape is async and cannot be used in a sync context');
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
   * Adds a check that is applied to the shape output.
   *
   * @param cb The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of this shape with the check added.
   */
  check(cb: CheckCallback<O>, options: CheckOptions = {}): this {
    const { key, unsafe = false, param } = options;

    const checks = key !== undefined ? this.checks.filter(check => check.key !== key) : this.checks.slice(0);

    checks.push({ key, callback: cb, unsafe, param });

    const shape = this._clone();

    shape.checks = checks;
    shape._applyChecks = createApplyChecksCallback(checks);
    shape._unsafe ||= unsafe;

    return shape;
  }

  /**
   * Parses the shape output using another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @returns The {@linkcode PipeShape} instance.
   * @template T The output value.
   */
  pipe<T>(shape: Shape<O, T>): Shape<I, T> {
    return new PipedShape(this, shape);
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The callback that transforms the shape output value.
   * @returns The {@linkcode TransformedShape} instance.
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
    return new TransformedShape(this, false, cb);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The callback that transforms the shape output value.
   * @returns The {@linkcode TransformedShape} instance.
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
    return new TransformedShape(this, true, cb);
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

  refine(cb: (output: O) => unknown, options?: RefineOptions | Message): this {
    const issueFactory = createIssueFactory(options, CODE_PREDICATE, MESSAGE_PREDICATE, cb);

    return addCheck(this, undefined, options, cb, output => {
      if (!cb(output)) {
        return issueFactory(output);
      }
    });
  }

  /**
   * Marks the type as optional.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @returns The {@linkcode ReplacerShape} instance.
   */
  optional<T = undefined>(defaultValue?: T): Shape<I | undefined, O | T> {
    return new ReplacementShape(this, undefined, defaultValue);
  }

  /**
   * Creates the nullable shape.
   *
   * @param defaultValue The value that should be used if an input value is `undefined`.
   * @returns The {@linkcode ReplacerShape} instance.
   */
  nullable<T = null>(defaultValue?: T): Shape<I | null, O | T> {
    return new ReplacementShape(this, null, defaultValue);
  }

  /**
   * Creates the shape that allows both `undefined` and `null` values.
   *
   * @param defaultValue The value that should be used if an input value is `undefined` or `null`.
   * @returns The {@linkcode ReplacerShape} instance.
   */
  nullish<T = null | undefined>(defaultValue?: T): Shape<I | null | undefined, O | T> {
    return this.nullable(defaultValue).optional(defaultValue);
  }

  /**
   * Synchronously parses the input.
   *
   * Use {@linkcode parse} or {@linkcode try} instead of this method whenever possible. Override this method to
   * implement custom shape.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { _applyChecks } = this;
    return _applyChecks !== null ? _applyChecks(input, null, options) : null;
  }

  /**
   * Asynchronously parses the input.
   *
   * Use {@linkcode parseAsync} or {@linkcode tryAsync} instead of this method whenever possible. Override this method
   * to implement custom shape that requires an async context.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O>> {
    return new Promise(resolve => resolve(this.apply(input, options)));
  }

  /**
   * Returns the shallow clone of this shape.
   */
  protected _clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  }
}

Object.defineProperty(Shape.prototype, 'try', {
  get() {
    const cb: Shape['try'] = (input, options) => {
      const result = this.apply(input, options || defaultParseOptions);

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

Object.defineProperty(Shape.prototype, 'parse', {
  get() {
    const cb: Shape['parse'] = (input, options) => {
      const result = this.apply(input, options || defaultParseOptions);

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

Object.defineProperty(Shape.prototype, 'tryAsync', {
  get() {
    const cb: Shape['tryAsync'] = (input, options) => {
      return this.applyAsync(input, options || defaultParseOptions).then((result: ApplyResult) => {
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

Object.defineProperty(Shape.prototype, 'parseAsync', {
  get() {
    const cb: Shape['parseAsync'] = (input, options) => {
      return this.applyAsync(input, options || defaultParseOptions).then((result: ApplyResult) => {
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

/**
 * The shape that applies a transformer callback to the base shape output.
 *
 * @template S The base shape.
 * @template O The transformed value.
 */
export class TransformedShape<S extends AnyShape, O> extends Shape<S['input'], O> {
  /**
   * Creates the new {@linkcode TransformedShape} instance.
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
    super(shape.async || async);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { shape, callback, _applyChecks } = this;

    let issues;
    let output = input;

    const result = shape.apply(input, options);

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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O>> {
    const { shape, callback, _applyChecks } = this;

    return shape.applyAsync(input, options).then(result => {
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
export class PipedShape<I extends AnyShape, O extends Shape<I['output'], any>> extends Shape<I['input'], O['output']> {
  /**
   * Creates the new {@linkcode PipedShape} instance.
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
    super(inputShape.async || outputShape.async);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<O['output']> {
    const { inputShape, outputShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = inputShape.apply(input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    const outputResult = outputShape.apply(output, options);

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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O['output']>> {
    const { inputShape, outputShape, _applyChecks } = this;

    let result: ApplyResult = null;
    let output = input;

    return inputShape
      .applyAsync(input, options)
      .then(inputResult => {
        if (inputResult !== null) {
          if (isArray(inputResult)) {
            return inputResult;
          }
          result = inputResult;
          output = inputResult.value;
        }

        return outputShape.applyAsync(output, options);
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
 * @template I The replaced value.
 * @template O The replacement value.
 */
export class ReplacementShape<S extends AnyShape, I, O = I> extends Shape<S['input'] | I, S['output'] | O> {
  private _result: ApplyResult<O>;

  /**
   * Creates the new {@linkcode ReplacementShape} instance.
   *
   * @param shape The shape that parses the input without the replaced value.
   * @param replacedValue The replaced value.
   * @param value The replacement value. If `undefined` then the replaced value is returned as is without any parsing.
   * @template S The shape that parses the input without the replaced value.
   * @template I The replaced value.
   * @template O The replacement value.
   */
  constructor(
    /**
     * The shape that parses the input without the replaced value.
     */
    readonly shape: S,
    /**
     * The replaced value.
     */
    readonly replacedValue: I,
    /**
     * The replacement value.
     */
    readonly value?: O
  ) {
    super(shape.async);

    this._result = value === undefined || value === replacedValue ? null : ok(value);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<S['output'] | O> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    const result = input === this.replacedValue ? this._result : this.shape.apply(input, options);

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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output'] | O>> {
    const { _applyChecks } = this;

    let issues;

    if (input === this.replacedValue) {
      if (_applyChecks !== null) {
        return new Promise(resolve => {
          issues = _applyChecks(this.value, null, options);

          resolve(issues !== null ? issues : this._result);
        });
      }
      return Promise.resolve(this._result);
    }

    return this.shape.applyAsync(input, options).then(result => {
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
