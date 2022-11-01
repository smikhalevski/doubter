import { ApplyResult, CheckCallback, CustomCheckOptions, Err, Ok, ParserOptions } from '../shared-types';
import { ApplyChecksCallback, Check, createApplyChecksCallback } from './createApplyChecksCallback';
import { isArray, isEqual, objectAssign, objectCreate } from '../lang-utils';
import { captureIssues, ok } from '../shape-utils';
import { ValidationError } from '../ValidationError';

export type AnyShape = Shape | Shape<never>;

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;

  try(input: unknown, options?: ParserOptions): Ok<O> | Err;

  parse(input: unknown, options?: ParserOptions): O;

  tryAsync(input: unknown, options?: ParserOptions): Promise<Ok<O> | Err>;

  parseAsync(input: unknown, options?: ParserOptions): Promise<O>;
}

export class Shape<I = any, O = I> {
  protected _applyChecks: ApplyChecksCallback | null = null;
  protected _checks: Check[] = [];
  protected _unsafe = false;

  constructor(readonly async: boolean) {}

  /**
   * Adds a custom check.
   *
   * @param callback The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of this shape with the check added.
   */
  check(callback: CheckCallback<O>, options?: CustomCheckOptions): this {
    const id = options?.id;
    const unsafe = Boolean(options?.unsafe);
    const checks = id == null ? this._checks : this._checks.filter(check => check.id !== id);
    const shape = this._clone();

    shape._applyChecks = createApplyChecksCallback(checks);
    shape._checks = checks.concat({ id, cb: callback, unsafe });
    shape._unsafe ||= unsafe;

    return shape;
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param cb The transformation callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transform<T>(cb: (value: I, options: Readonly<ParserOptions>) => T): Shape<I, T> {
    return new TransformedShape(this, false, cb);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param cb The value transformer callback.
   * @returns The {@linkcode TransformedShape}.
   * @template T The transformed value.
   */
  transformAsync<T>(cb: (value: I, options: Readonly<ParserOptions>) => Promise<T>): Shape<I, T> {
    return new TransformedShape(this, true, cb);
  }

  /**
   * Parses the output of this shape using another shape.
   *
   * @param shape The shape that validates the output if this shape.
   * @returns The {@linkcode PipedShape}.
   * @template T The pipe output value.
   */
  pipe<T>(shape: Shape<O, T>): Shape<I, T> {
    return new PipedShape(this, shape);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<O> {
    const { _applyChecks } = this;
    return _applyChecks !== null ? _applyChecks(input, null, options) : null;
  }

  _applyAsync(input: unknown, options: ParserOptions): Promise<ApplyResult<O>> {
    return new Promise(resolve => resolve(this._apply(input, options)));
  }

  protected _clone(): this {
    return objectAssign(objectCreate(Object.getPrototypeOf(this)), this);
  }
}

const prototype = Shape.prototype;

const parserOptions: ParserOptions = Object.freeze({ verbose: false });

Object.defineProperty(prototype, 'try', {
  get(this: Shape) {
    let cb: Shape['try'];

    if (this.async) {
      cb = () => {
        throw new Error('The async shape cannot be used in a sync context, use tryAsync instead');
      };
    } else {
      cb = (input, options) => {
        const result = this._apply(input, options || parserOptions);

        if (result === null) {
          return ok(input);
        }
        if (isArray(result)) {
          return { ok: false, issues: result };
        }
        return ok(result.value);
      };
    }

    Object.defineProperty(this, 'try', { value: cb });

    return cb;
  },
});

Object.defineProperty(prototype, 'parse', {
  get(this: Shape) {
    let cb: Shape['parse'];

    if (this.async) {
      cb = () => {
        throw new Error('The async shape cannot be used in a sync context, use parseAsync instead');
      };
    } else {
      cb = (input, options) => {
        const result = this._apply(input, options || parserOptions);

        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          throw new ValidationError(result);
        }
        return result.value;
      };
    }

    Object.defineProperty(this, 'parse', { value: cb });

    return cb;
  },
});

Object.defineProperty(prototype, 'tryAsync', {
  get(this: Shape) {
    let cb: Shape['tryAsync'];

    if (this.async) {
      cb = (input, options) => {
        return this._applyAsync(input, options || parserOptions).then(result => {
          if (result === null) {
            return ok(input);
          }
          if (isArray(result)) {
            return { ok: false, issues: result };
          }
          return result;
        });
      };
    } else {
      cb = (input, options) => {
        return new Promise(resolve => {
          const result = this._apply(input, options || parserOptions);

          if (result === null) {
            resolve(ok(input));
            return;
          }
          if (isArray(result)) {
            resolve({ ok: false, issues: result });
            return;
          }
          resolve(result);
        });
      };
    }

    Object.defineProperty(this, 'tryAsync', { value: cb });

    return cb;
  },
});

Object.defineProperty(prototype, 'parseAsync', {
  get(this: Shape) {
    let cb: Shape['parseAsync'];

    if (this.async) {
      cb = (input, options) => {
        return this._applyAsync(input, options || parserOptions).then(result => {
          if (result === null) {
            return input;
          }
          if (isArray(result)) {
            throw new ValidationError(result);
          }
          return result.value;
        });
      };
    } else {
      cb = (input, options) => {
        return new Promise((resolve, reject) => {
          const result = this._apply(input, options || parserOptions);

          if (result === null) {
            resolve(input);
            return;
          }
          if (isArray(result)) {
            reject(new ValidationError(result));
            return;
          }
          resolve(result.value);
        });
      };
    }

    Object.defineProperty(this, 'parseAsync', { value: cb });

    return cb;
  },
});

export class TransformedShape<S extends AnyShape, T> extends Shape<S['input'], T> {
  constructor(
    readonly shape: S,
    async: boolean,
    readonly transformer: (input: S['input'], options: ParserOptions) => Promise<T> | T
  ) {
    super(shape.async || async);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<T> {
    const { shape, transformer, _applyChecks } = this;

    let issues;
    let output = input;

    const result = shape._apply(input, options);

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

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    if (isEqual(input, output)) {
      return null;
    }
    return ok(output as T);
  }

  _applyAsync(input: unknown, options: ParserOptions): Promise<ApplyResult<T>> {
    const { shape, transformer, _applyChecks } = this;

    return shape._applyAsync(input, options).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return new Promise<T>(resolve => resolve(transformer(output, options))).then(output => {
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

export class PipedShape<I extends AnyShape, O extends Shape<I['output'], any>> extends Shape<I['input'], O['output']> {
  constructor(readonly inputShape: I, readonly outputShape: O) {
    super(inputShape.async || outputShape.async);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<O['output']> {
    const { inputShape, outputShape, _applyChecks } = this;

    let issues;
    let output = input;

    let result = inputShape._apply(input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    const outputResult = outputShape._apply(output, options);

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

  _applyAsync(input: unknown, options: ParserOptions): Promise<ApplyResult<O['output']>> {
    const { inputShape, outputShape, _applyChecks } = this;

    let result: ApplyResult = null;
    let output = input;

    return inputShape
      ._applyAsync(input, options)
      .then(inputResult => {
        if (inputResult !== null) {
          if (isArray(inputResult)) {
            return inputResult;
          }
          result = inputResult;
          output = inputResult.value;
        }

        return outputShape._applyAsync(output, options);
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
