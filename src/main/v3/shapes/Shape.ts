import { ApplyResult, Check, CustomCheckOptions, Err, Issue, Ok, ParserOptions } from '../shared-types';
import { ApplyChecks, createApplyChecks } from './createApplyChecks';
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
  protected _applyChecks: ApplyChecks | null = null;
  protected _checks: any[] = [];
  protected _unsafe = false;

  constructor(readonly async: boolean) {}

  /**
   * Adds a custom check.
   *
   * @param check The check to add.
   * @param options The check options or an issue message.
   * @returns The clone of this shape with the check added.
   */
  check(check: Check<O>, options?: CustomCheckOptions): this {
    const id = options?.id;
    const unsafe = options?.unsafe;
    const checks = this._checks.slice(0);

    if (id != null) {
      for (let i = 0; i < checks.length; i += 3) {
        if (checks[i] === id) {
          checks.splice(i, 3);
          break;
        }
      }
    }

    checks.push(id, Boolean(unsafe), check);

    const shape = this.clone();
    shape._checks = checks;
    shape._applyChecks = createApplyChecks(checks);

    return shape;
  }

  /**
   * Synchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param transformer The transformation callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transform<T>(transformer: (value: I) => T): Shape<I, T> {
    return new TransformedShape(this, false, input => {
      let value;
      try {
        value = transformer(input);
      } catch (error) {
        return getErrorIssues(error);
      }
      return isEqual(input, value) ? null : ok(value);
    });
  }

  /**
   * Asynchronously transforms the output value of the shape with a transformer callback. The callback may throw
   * {@linkcode ValidationError} to notify that the transformation cannot be successfully completed.
   *
   * @param transformer The value transformer callback.
   * @return The transformed shape.
   * @template T The transformed value.
   */
  transformAsync<T>(transformer: (value: I) => Promise<T>): Shape<I, T> {
    return new TransformedShape(this, true, input => {
      return Promise.resolve(transformer(input)).then(
        value => (isEqual(input, value) ? null : ok(value)),
        getErrorIssues
      );
    });
  }

  pipe<T>(to: Shape<O, T>): Shape<I, T>;

  pipe<S extends Shape<O, any>>(to: (input: unknown) => S): Shape<I, S['output']>;

  pipe(to: ((input: unknown) => AnyShape) | AnyShape): AnyShape {
    if (typeof to !== 'function' && to.async) {
      throw new Error('Cannot synchronously pipe to the asynchronous shape, use pipeAsync instead');
    }
    return new TransformedShape(
      this,
      false,
      typeof to === 'function' ? input => to(input)._apply(input, false) : input => to._apply(input, false)
    );
  }

  pipeAsync<T>(to: Shape<O, T>): Shape<I, T>;

  pipeAsync<S extends Shape<O, any>>(to: (input: unknown) => Promise<S> | S): Shape<I, S['output']>;

  pipeAsync(to: ((input: unknown) => AnyShape) | AnyShape): AnyShape {
    if (typeof to !== 'function' && !to.async) {
      return this.pipe(to);
    }
    return new TransformedShape(
      this,
      true,
      typeof to === 'function'
        ? input => Promise.resolve(to(input)).then(shape => shape._applyAsync(input, false))
        : input => to._applyAsync(input, false)
    );
  }

  clone(): this {
    return objectAssign(objectCreate(Object.getPrototypeOf(this)), this);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<O> {
    const { _applyChecks } = this;
    if (_applyChecks !== null) {
      return _applyChecks(input, null, earlyReturn);
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

    const value: Shape['try'] = (input, options) => {
      const result = shape._apply(input, options != null && !options.verbose);

      if (result === null) {
        return ok(input);
      }
      if (isArray(result)) {
        return { ok: false, issues: result };
      }
      return ok(result.value);
    };

    defineProperty(this, 'try', { value });

    return value;
  },
});

defineProperty(prototype, 'parse', {
  get() {
    const shape = this;

    const value: Shape['parse'] = (input, options) => {
      const result = shape._apply(input, options != null && !options.verbose);

      if (result === null) {
        return input;
      }
      if (isArray(result)) {
        throw new ValidationError(result);
      }
      return result.value;
    };

    defineProperty(this, 'parse', { value });

    return value;
  },
});

defineProperty(prototype, 'tryAsync', {
  get() {
    const shape = this;

    let value: Shape['tryAsync'];

    if (this.async) {
      value = (input, options) =>
        shape._applyAsync(input, options != null && !options.verbose).then(result => {
          if (result === null) {
            return ok(input);
          }
          if (isArray(result)) {
            return { ok: false, issues: result };
          }
          return result;
        });
    } else {
      value = (input, options) =>
        new Promise((resolve, reject) => {
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
      value = (input, options) =>
        shape._applyAsync(input, options != null && !options.verbose).then(result => {
          if (result === null) {
            return input;
          }
          if (isArray(result)) {
            throw new ValidationError(result);
          }
          return result.value;
        });
    } else {
      value = (input, options) =>
        new Promise((resolve, reject) => {
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
    }

    defineProperty(this, 'parseAsync', { value });

    return value;
  },
});

/**
 * The shape that applies a transformer to the output of the base shape.
 *
 * @template I The base shape input value.
 * @template O The base shape output value.
 * @template T The transformed value.
 */
export class TransformedShape<S extends AnyShape, T> extends Shape<S['input'], T> {
  /**
   * Creates the new {@linkcode TransformedShape}.
   *
   * @param shape The base shape.
   * @param async If `true` then transformer must return a promise.
   * @param _transformer The transformation callback.
   */
  constructor(
    protected shape: S,
    async: boolean,
    protected _transformer: (input: S['input']) => Promise<ApplyResult<T>> | ApplyResult<T>
  ) {
    super(shape.async || async);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<T> {
    const { shape, _transformer, _applyChecks, _unsafe } = this;

    let issues: Issue[] | null = null;
    let output = input;

    const result1 = shape._apply(input, earlyReturn);

    if (result1 !== null) {
      if (isArray(result1)) {
        return result1;
      }
      output = result1.value;
    }

    const result2 = _transformer(input) as ApplyResult<T>;

    if (result2 !== null) {
      if (isArray(result2)) {
        issues = result2;

        if (earlyReturn) {
          return issues;
        }
      } else {
        output = result2.value;
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, earlyReturn);
    }
    if (issues !== null) {
      return issues;
    }
    return ok(output as T);
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<T>> {
    const { shape, _transformer, _applyChecks, _unsafe } = this;

    return shape
      ._applyAsync(input, earlyReturn)
      .then(result1 => {
        if (result1 !== null) {
          return isArray(result1) ? result1 : _transformer(result1.value);
        }
        return _transformer(input);
      })
      .then(result2 => {
        let issues: Issue[] | null = null;
        let output = input;

        if (result2 !== null) {
          if (isArray(result2)) {
            issues = result2;

            if (earlyReturn) {
              return issues;
            }
          } else {
            output = result2.value;
          }
        }

        if (_applyChecks !== null && (_unsafe || issues === null)) {
          issues = _applyChecks(output, issues, earlyReturn);
        }
        if (issues !== null) {
          return issues;
        }
        return ok(output as T);
      });
  }
}
