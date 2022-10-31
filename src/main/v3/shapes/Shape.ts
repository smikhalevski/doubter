import { ApplyResult, CheckCallback, CustomCheckOptions, Err, Ok, ParserOptions } from '../shared-types';
import { ApplyChecksCallback, Check, createApplyChecksCallback } from './createApplyChecksCallback';
import { isArray, objectAssign, objectCreate } from '../lang-utils';
import { getErrorIssues, ok } from '../shape-utils';
import { ValidationError } from './ValidationError';
import { isEqual } from '../../lang-utils';

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
    const shape = this.clone();

    shape._applyChecks = createApplyChecksCallback(checks);
    shape._checks = checks.concat({ id, cb: callback, unsafe });
    shape._unsafe ||= unsafe;

    return shape;
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param callback The transformation callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transform<T>(callback: (value: I) => T): Shape<I, T> {
    return new TransformedShape(this, false, callback);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param callback The value transformer callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transformAsync<T>(callback: (value: I) => Promise<T>): Shape<I, T> {
    return new TransformedShape(this, true, callback);
  }

  pipe<T>(shape: Shape<O, T>): Shape<I, T> {
    return new PipedShape(this, shape);
  }

  clone(): this {
    return objectAssign(objectCreate(Object.getPrototypeOf(this)), this);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<O> {
    const { _applyChecks } = this;
    return _applyChecks !== null ? _applyChecks(input, null, earlyReturn) : null;
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<O>> {
    return new Promise(resolve => resolve(this._apply(input, earlyReturn)));
  }
}

const prototype = Shape.prototype;

Object.defineProperty(prototype, 'try', {
  get(this: Shape) {
    const shape = this;

    let tryCallback: Shape['try'];

    if (this.async) {
      tryCallback = () => {
        throw new Error('Shape is async and cannot be used in a sync context, use tryAsync instead');
      };
    } else {
      tryCallback = (input, options) => {
        const result = shape._apply(input, options == null || !options.verbose);

        if (result === null) {
          return ok(input);
        }
        if (isArray(result)) {
          return { ok: false, issues: result };
        }
        return ok(result.value);
      };
    }

    Object.defineProperty(this, 'try', { value: tryCallback });

    return tryCallback;
  },
});

Object.defineProperty(prototype, 'parse', {
  get(this: Shape) {
    const shape = this;

    let parseCallback: Shape['parse'];

    if (this.async) {
      parseCallback = () => {
        throw new Error('Shape is async and cannot be used in a sync context, use parseAsync instead');
      };
    } else {
      parseCallback = (input, options) => {
        const result = shape._apply(input, options == null || !options.verbose);

        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          throw new ValidationError(result);
        }
        return result.value;
      };
    }

    Object.defineProperty(this, 'parse', { value: parseCallback });

    return parseCallback;
  },
});

Object.defineProperty(prototype, 'tryAsync', {
  get(this: Shape) {
    const shape = this;

    let tryAsyncCallback: Shape['tryAsync'];

    if (this.async) {
      tryAsyncCallback = (input, options) => {
        return shape._applyAsync(input, options == null || !options.verbose).then(result => {
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
      tryAsyncCallback = (input, options) => {
        return new Promise((resolve, reject) => {
          const result = shape._apply(input, options == null || !options.verbose);

          if (result === null) {
            resolve(ok(input));
            return;
          }
          if (isArray(result)) {
            reject({ ok: false, issues: result });
            return;
          }
          resolve(result);
        });
      };
    }

    Object.defineProperty(this, 'tryAsync', { value: tryAsyncCallback });

    return tryAsyncCallback;
  },
});

Object.defineProperty(prototype, 'parseAsync', {
  get(this: Shape) {
    const shape = this;

    let parseAsyncCallback: Shape['parseAsync'];

    if (this.async) {
      parseAsyncCallback = (input, options) => {
        return shape._applyAsync(input, options == null || !options.verbose).then(result => {
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
      parseAsyncCallback = (input, options) => {
        return new Promise((resolve, reject) => {
          const result = shape._apply(input, options == null || !options.verbose);

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

    Object.defineProperty(this, 'parseAsync', { value: parseAsyncCallback });

    return parseAsyncCallback;
  },
});

export class TransformedShape<S extends AnyShape, T> extends Shape<S['input'], T> {
  constructor(readonly shape: S, async: boolean, readonly callback: (input: S['input']) => Promise<T> | T) {
    super(shape.async || async);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<T> {
    const { shape, callback, _applyChecks } = this;

    let output = input;

    const result = shape._apply(input, earlyReturn);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    try {
      output = callback(output);
    } catch (error) {
      return getErrorIssues(error);
    }

    if (_applyChecks !== null) {
      const issues = _applyChecks(output, null, earlyReturn);

      if (issues !== null) {
        return issues;
      }
    }
    return isEqual(input, output) ? null : ok(output as T);
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<T>> {
    const { shape, callback, _applyChecks } = this;

    return shape._applyAsync(input, earlyReturn).then(result => {
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      return new Promise<T>(resolve => resolve(callback(output))).then(
        output => {
          if (_applyChecks !== null) {
            const issues = _applyChecks(output, null, earlyReturn);

            if (issues !== null) {
              return issues;
            }
          }
          return isEqual(input, output) ? null : ok(output);
        },
        error => getErrorIssues(error)
      );
    });
  }
}

export class PipedShape<I extends AnyShape, O extends Shape<I['output'], any>> extends Shape<I['input'], O['output']> {
  constructor(readonly inputShape: I, readonly outputShape: O) {
    super(inputShape.async || outputShape.async);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<O['output']> {
    const { inputShape, outputShape, _applyChecks } = this;

    let output = input;

    const inputResult = inputShape._apply(input, earlyReturn);

    if (inputResult !== null) {
      if (isArray(inputResult)) {
        return inputResult;
      }
      output = inputResult.value;
    }

    const outputResult = outputShape._apply(output, earlyReturn);

    if (outputResult !== null) {
      if (isArray(outputResult)) {
        return outputResult;
      }
      output = outputResult.value;
    }

    if (_applyChecks !== null) {
      const issues = _applyChecks(output, null, earlyReturn);

      if (issues !== null) {
        return issues;
      }
    }
    return isEqual(input, output) ? null : ok(output);
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<O['output']>> {
    const { inputShape, outputShape, _applyChecks } = this;

    return inputShape
      ._applyAsync(input, earlyReturn)
      .then(inputResult => {
        if (inputResult !== null) {
          return isArray(inputResult) ? inputResult : outputShape._applyAsync(inputResult.value, earlyReturn);
        }
        return outputShape._applyAsync(input, earlyReturn);
      })
      .then(outputResult => {
        let output = input;

        if (outputResult !== null) {
          if (isArray(outputResult)) {
            return outputResult;
          }
          output = outputResult.value;
        }

        if (_applyChecks !== null) {
          const issues = _applyChecks(output, null, earlyReturn);

          if (issues !== null) {
            return issues;
          }
        }
        return isEqual(input, output) ? null : ok(output);
      });
  }
}
