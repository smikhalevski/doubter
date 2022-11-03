import {
  ApplyResult,
  CheckCallback,
  CheckOptions,
  Err,
  Message,
  Ok,
  ParseOptions,
  RefineOptions,
} from '../shared-types';
import { ApplyChecksCallback, Check, createApplyChecksCallback } from './createApplyChecksCallback';
import { isArray, isEqual } from '../lang-utils';
import { addCheck, captureIssues, createCheckConfig, ok, raiseIssue } from '../shape-utils';
import { ValidationError } from '../ValidationError';
import { CODE_PREDICATE, MESSAGE_PREDICATE } from './constants';

const defaultParseOptions: ParseOptions = Object.freeze({ verbose: false });

/**
 * An arbitrary shape.
 */
export type AnyShape = Shape | Shape<never>;

export interface Shape<I, O> {
  /**
   * The shape input type. Accessible only at compile time and should be used for type inference.
   */
  readonly input: I;

  /**
   * The shape output type. Accessible only at compile time and should be used for type inference.
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
   * Asynchronously parses the value and returns {@linkcode Ok} or {@linkcode Err} object that wraps the result.
   *
   * @param input The value to parse.
   * @param options Parsing options.
   * @returns The {@linkcode Ok} instance if parsing has succeeded or {@linkcode Err} if parsing has failed.
   */
  tryAsync(input: unknown, options?: ParseOptions): Promise<Ok<O> | Err>;

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
   * Applies checks to the output.
   */
  protected applyChecks: ApplyChecksCallback | null = null;

  /**
   * The list of checks added to the shape.
   */
  protected checks: Check[] = [];

  /**
   * `true` if some checks from {@linkcode checks} were marked as unsafe, `false` otherwise.
   */
  protected unsafe = false;

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
     * Otherwise, shape can be used in both sync and async contexts.
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
  check(cb: CheckCallback<O>, options?: CheckOptions): this {
    const id = options?.id;
    const unsafe = Boolean(options?.unsafe);
    const checks = id == null ? this.checks : this.checks.filter(check => check.id !== id);
    const shape = this.clone();

    shape.applyChecks = createApplyChecksCallback(checks);
    shape.checks = checks.concat({ id, cb: cb, unsafe });
    shape.unsafe ||= unsafe;

    return shape;
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The transformation callback.
   * @returns The {@linkcode TransformedShape} instance.
   * @template T The transformed value.
   */
  transform<T>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return The transformation result.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    cb: (output: O, options: Readonly<ParseOptions>) => T
  ): Shape<I, T> {
    return new TransformedShape(this, false, cb);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback.
   *
   * @param cb The value transformer callback.
   * @returns The {@linkcode TransformedShape} instance.
   * @template T The transformed value.
   */
  transformAsync<T>(
    /**
     * @param output The shape output value.
     * @param options Parsing options.
     * @return The transformation result.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    cb: (output: O, options: Readonly<ParseOptions>) => Promise<T>
  ): Shape<I, T> {
    return new TransformedShape(this, true, cb);
  }

  /**
   * Parses the output of this shape using another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @returns The {@linkcode PipedShape} instance.
   * @template R The pipe output value.
   */
  pipe<T>(shape: Shape<O, T>): Shape<I, T> {
    return new PipedShape(this, shape);
  }

  /**
   * Refines the shape output type with the [narrowing predicate](https://www.typescriptlang.org/docs/handbook/2/narrowing.html).
   *
   * @param predicate The predicate that returns `true` if value conforms the required type, or `false` otherwise.
   * @param options The constraint options or an issue message.
   * @returns The shape that has the narrowed output.
   * @template R The narrowed output value.
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
   * @returns The clone of this shape with the constraint added.
   * @template T The narrowed value.
   */
  refine(
    /**
     * @param output The shape output value.
     */
    predicate: (output: O) => any,
    options?: RefineOptions | Message
  ): this;

  refine(predicate: (output: any) => unknown, options?: RefineOptions | Message): this {
    const checkConfig = createCheckConfig(options, CODE_PREDICATE, MESSAGE_PREDICATE, predicate);

    return addCheck(this, undefined, options, output => {
      if (!predicate(output)) {
        return raiseIssue(checkConfig, output);
      }
    });
  }

  /**
   * Synchronously parses the input.
   *
   * This method is the part of the internal parsing mechanism that should be overridden in custom shapes.
   *
   * @param input The shape input to parse.
   * @param options Parsing options.
   * @returns `null` if input matches the output, {@linkcode Ok} that wraps the output, or an array of captured issues.
   */
  apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { applyChecks } = this;
    return applyChecks !== null ? applyChecks(input, null, options) : null;
  }

  /**
   * Asynchronously parses the input.
   *
   * This method is the part of the internal parsing mechanism that should be overridden in custom shapes.
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
  clone(): this {
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
 * The shape that applies a transformer to the output of the base shape.
 *
 * @template S The base shape.
 * @template O The transformed output value.
 */
export class TransformedShape<S extends AnyShape, O> extends Shape<S['input'], O> {
  /**
   * Creates the new {@linkcode TransformedShape} instance.
   *
   * @param shape The base shape.
   * @param async If `true` then the transformed shape would await for transformer to finish its transformation and use
   * the resolved value as an output. Otherwise, the value that is synchronously returned from the transformer is used
   * as an output.
   * @param transformer The transformation callback.
   * @template S The base shape.
   * @template O The transformed output value.
   */
  constructor(
    /**
     * The base shape which output value is transformed.
     */
    readonly shape: S,
    async: boolean,
    /**
     * The transformation callback.
     *
     * @param output The {@linkcode shape} output value that must be transformed.
     * @param options Parsing options.
     * @return The transformation result.
     * @throws {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
     */
    readonly transformer: (output: S['output'], options: ParseOptions) => Promise<O> | O
  ) {
    super(shape.async || async);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<O> {
    const { shape, transformer, applyChecks } = this;

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
      output = transformer(output, options);
    } catch (error) {
      return captureIssues(error);
    }

    if (applyChecks !== null) {
      issues = applyChecks(output, null, options);

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
    const { shape, transformer, applyChecks } = this;

    return shape.applyAsync(input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return new Promise<O>(resolve => resolve(transformer(output, options))).then(output => {
        let issues;

        if (applyChecks !== null) {
          issues = applyChecks(output, null, options);

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

export class PipedShape<I extends AnyShape, O extends Shape<I['output'], any>> extends Shape<I['input'], O['output']> {
  constructor(readonly inputShape: I, readonly outputShape: O) {
    super(inputShape.async || outputShape.async);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<O['output']> {
    const { inputShape, outputShape, applyChecks } = this;

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

    if (applyChecks !== null) {
      issues = applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<O['output']>> {
    const { inputShape, outputShape, applyChecks } = this;

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

        if (applyChecks !== null) {
          issues = applyChecks(output, null, options);

          if (issues !== null) {
            return issues;
          }
        }
        return result;
      });
  }
}
