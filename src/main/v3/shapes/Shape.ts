import { ApplyResult, CheckCallback, CustomCheckOptions, Err, Ok, ParserOptions } from '../shared-types';
import { ApplyChecksCallback, Check, createApplyChecksCallback } from './createApplyChecksCallback';
import { defineProperty, isArray, objectAssign, objectCreate } from '../lang-utils';
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
  protected applyChecks: ApplyChecksCallback | null = null;
  protected checks: Check[] = [];
  protected unsafe = false;

  constructor(readonly async: boolean) {}

  /**
   * Adds a custom check.
   *
   * @param cb The callback that checks the shape output.
   * @param options The check options.
   * @returns The clone of this shape with the check added.
   */
  check(cb: CheckCallback<O>, options?: CustomCheckOptions): this {
    const id = options?.id;
    const unsafe = Boolean(options?.unsafe);
    const checks = id == null ? this.checks : this.checks.filter(check => check.id !== id);
    const shape = this.clone();

    shape.applyChecks = createApplyChecksCallback(checks);
    shape.checks = checks.concat({ id, cb, unsafe });
    shape.unsafe ||= unsafe;

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
  transform<T>(cb: (value: I) => T): Shape<I, T> {
    return new TransformedShape(this, false, cb);
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param cb The value transformer callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transformAsync<T>(cb: (value: I) => Promise<T>): Shape<I, T> {
    return new TransformedShape(this, true, cb);
  }

  pipe<T>(to: Shape<O, T>): Shape<I, T> {
    return new PipedShape(this, to);
  }

  clone(): this {
    return objectAssign(objectCreate(Object.getPrototypeOf(this)), this);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<O> {
    const { applyChecks } = this;
    if (applyChecks !== null) {
      return applyChecks(input, null, earlyReturn);
    }
    return null;
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<O>> {
    return new Promise(resolve => resolve(this._apply(input, earlyReturn)));
  }
}

const prototype = Shape.prototype;

defineProperty(prototype, 'try', {
  get() {
    const shape = this;

    let value: Shape['try'];

    if (this.async) {
      value = () => {
        throw new Error('Shape is async');
      };
    } else {
      value = (input, options) => {
        const result = shape._apply(input, options != null && !options.verbose);

        if (result === null) {
          return ok(input);
        }
        if (isArray(result)) {
          return { ok: false, issues: result };
        }
        return ok(result.value);
      };
    }

    defineProperty(this, 'try', { value });

    return value;
  },
});

defineProperty(prototype, 'parse', {
  get() {
    const shape = this;

    let value: Shape['parse'];

    if (this.async) {
      value = () => {
        throw new Error('Shape is async');
      };
    } else {
      value = (input, options) => {
        const result = shape._apply(input, options != null && !options.verbose);

        if (result === null) {
          return input;
        }
        if (isArray(result)) {
          throw new ValidationError(result);
        }
        return result.value;
      };
    }

    defineProperty(this, 'parse', { value });

    return value;
  },
});

defineProperty(prototype, 'tryAsync', {
  get() {
    const shape = this;

    let value: Shape['tryAsync'];

    if (this.async) {
      value = (input, options) => {
        return shape._applyAsync(input, options != null && !options.verbose).then(result => {
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
      value = (input, options) => {
        return new Promise((resolve, reject) => {
          const result = shape._apply(input, options != null && !options.verbose);

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

    defineProperty(this, 'tryAsync', { value });

    return value;
  },
});

defineProperty(prototype, 'parseAsync', {
  get() {
    const shape = this;

    let value: Shape['parseAsync'];

    if (this.async) {
      value = (input, options) => {
        return shape._applyAsync(input, options != null && !options.verbose).then(result => {
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
      value = (input, options) => {
        return new Promise((resolve, reject) => {
          const result = shape._apply(input, options != null && !options.verbose);

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

    defineProperty(this, 'parseAsync', { value });

    return value;
  },
});

export class TransformedShape<S extends AnyShape, T> extends Shape<S['input'], T> {
  constructor(readonly shape: S, async: boolean, readonly callback: (input: S['input']) => Promise<T> | T) {
    super(shape.async || async);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<T> {
    const { shape, callback, applyChecks } = this;

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

    if (applyChecks !== null) {
      const issues = applyChecks(output, null, earlyReturn);

      if (issues !== null) {
        return issues;
      }
    }
    return isEqual(input, output) ? null : ok(output as T);
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<T>> {
    const { shape, callback, applyChecks } = this;

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
          if (applyChecks !== null) {
            const issues = applyChecks(output, null, earlyReturn);

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
    const { inputShape, outputShape, applyChecks } = this;

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

    if (applyChecks !== null) {
      const issues = applyChecks(output, null, earlyReturn);

      if (issues !== null) {
        return issues;
      }
    }
    return isEqual(input, output) ? null : ok(output);
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<O['output']>> {
    const { inputShape, outputShape, applyChecks } = this;

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

        if (applyChecks !== null) {
          const issues = applyChecks(output, null, earlyReturn);

          if (issues !== null) {
            return issues;
          }
        }
        return isEqual(input, output) ? null : ok(output);
      });
  }
}
