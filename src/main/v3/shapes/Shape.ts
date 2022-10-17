import { ApplyResult, Check, CustomCheckOptions, Err, Ok, ParserOptions } from '../shared-types';
import { ApplyChecks, createApplyChecks } from './createApplyChecks';
import { defineProperty, isArray, objectAssign, objectCreate } from '../lang-utils';
import { ok } from '../shape-utils';
import { createValidationError } from './ValidationError';

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
        throw createValidationError(result);
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
            throw createValidationError(result);
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
            reject(createValidationError(result));
            return;
          }
          resolve(result.value);
        });
    }

    defineProperty(this, 'parseAsync', { value });

    return value;
  },
});
