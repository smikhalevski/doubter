import {
  defineProperty,
  isArray,
  isFinite,
  isObjectLike,
  isString,
  objectAssign,
  objectCreate,
  objectKeys,
  objectValues,
} from '../lang-utils';
import { Check, Dict, IdentifiableConstraintOptions, Issue } from '../shared-types';
import { ApplyChecks } from './createApplyChecks';
import {
  CODE_TYPE,
  CODE_UNKNOWN_KEYS,
  MESSAGE_UNKNOWN_KEYS,
  TYPE_BOOLEAN,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../../shapes/constants';
import { concatIssues, createIssue, isAsyncShapes, prependKey, pushIssue, raiseIssue } from '../shape-utils';
import { createValidationError } from './ValidationError';

export interface Ok<T> {
  ok: true;
  value: T;
}

export interface Err {
  ok: false;
  issues: Issue[];
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export type ApplyResult<T = any> = Ok<T> | Issue[] | null;

// ---------------------------------------------------------------------------------------------------------------------

export type AnyShape = Shape | Shape<never>;

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;

  try(input: unknown): Ok<O> | Err;

  parse(input: unknown): O;

  tryAsync(input: unknown): Promise<Ok<O> | Err>;

  parseAsync(input: unknown): Promise<O>;

  check(check: Check<O>, options?: IdentifiableConstraintOptions): this;
}

export class Shape<I = any, O = I> {
  protected _applyChecks: ApplyChecks | null = null;
  protected _checks: any[] = [];
  protected _unsafe = false;

  constructor(readonly async: boolean) {}

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

const shapePrototype = Shape.prototype;

defineProperty(shapePrototype, 'try', {
  get() {
    const shape = this;

    const value: Shape['try'] = input => {
      const result = shape._apply(input, false);

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

defineProperty(shapePrototype, 'parse', {
  get() {
    const shape = this;

    const value: Shape['parse'] = input => {
      const result = shape._apply(input, false);

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

defineProperty(shapePrototype, 'tryAsync', {
  get() {
    const shape = this;

    let value: Shape['tryAsync'];

    if (this.async) {
      value = input =>
        shape._applyAsync(input, false).then(result => {
          if (result === null) {
            return ok(input);
          }
          if (isArray(result)) {
            return { ok: false, issues: result };
          }
          return result;
        });
    } else {
      value = input =>
        new Promise((resolve, reject) => {
          const result = shape._apply(input, false);

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

defineProperty(shapePrototype, 'parseAsync', {
  get() {
    const shape = this;

    let value: Shape['parseAsync'];

    if (this.async) {
      value = input =>
        shape._applyAsync(input, false).then(result => {
          if (result === null) {
            return input;
          }
          if (isArray(result)) {
            throw createValidationError(result);
          }
          return result.value;
        });
    } else {
      value = input =>
        new Promise((resolve, reject) => {
          const result = shape._apply(input, false);

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

// ---------------------------------------------------------------------------------------------------------------------

export class StringShape extends Shape<string> {
  _apply(input: unknown, earlyReturn: boolean): ApplyResult<string> {
    const { _applyChecks } = this;

    if (!isString(input)) {
      return raiseIssue(CODE_TYPE, input, undefined, TYPE_STRING, undefined);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, earlyReturn);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export class NumberShape extends Shape<number> {
  _apply(input: unknown, earlyReturn: boolean): ApplyResult<number> {
    const { _applyChecks } = this;

    if (!isFinite(input)) {
      return raiseIssue(CODE_TYPE, input, undefined, TYPE_NUMBER, undefined);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, earlyReturn);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export class BooleanShape extends Shape<boolean> {
  _apply(input: unknown, earlyReturn: boolean): ApplyResult<boolean> {
    const { _applyChecks } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(CODE_TYPE, input, undefined, TYPE_BOOLEAN, undefined);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, null, earlyReturn);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export type Channel = 'input' | 'output';

export type InferObject<P extends Dict<AnyShape>, I extends AnyShape, C extends Channel> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferRest<I, C>
>;

export type InferRest<I extends AnyShape, C extends Channel> = I extends Shape ? { [rest: string]: I[C] } : unknown;

export type ObjectKey<T extends object> = StringifyPropertyKey<keyof T>;

export type StringifyPropertyKey<K extends PropertyKey> = K extends symbol ? never : K extends number ? `${K}` : K;

export type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

export type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type Flags = number[] | number;

export const enum KeysMode {
  PRESERVED,
  STRIPPED,
  EXACT,
}

export class ObjectShape<P extends Dict<AnyShape>, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  readonly keys: readonly ObjectKey<P>[];

  protected readonly _valueShapes: Shape[];

  constructor(
    readonly shapes: Readonly<P>,
    readonly restShape: I | null = null,
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    const keys = objectKeys(shapes);
    const valueShapes = objectValues(shapes);

    super((restShape !== null && restShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys as ObjectKey<P>[];

    this._valueShapes = valueShapes;
  }

  extend<T extends Dict<AnyShape>>(shape: ObjectShape<T, any>): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any> | Dict): ObjectShape<any, I> {
    const shapes = objectAssign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.restShape, KeysMode.PRESERVED);
  }

  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.indexOf(key) !== -1) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.restShape, KeysMode.PRESERVED);
  }

  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.indexOf(key) === -1) {
        shapes[key] = this._valueShapes[i];
      }
    }
    return new ObjectShape<any, I>(shapes, this.restShape, KeysMode.PRESERVED);
  }

  exact(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, KeysMode.EXACT);
  }

  strip(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, KeysMode.STRIPPED);
  }

  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, KeysMode.PRESERVED);
  }

  rest<I extends AnyShape>(restShape: I): ObjectShape<P, I> {
    return new ObjectShape(this.shapes, restShape, KeysMode.PRESERVED);
  }

  _apply(input: unknown, earlyReturn: boolean): ApplyResult<InferObject<P, I, 'output'>> {
    if (!isObjectLike(input)) {
      return raiseIssue(CODE_TYPE, input, undefined, TYPE_OBJECT, undefined);
    }
    if (this.keysMode !== KeysMode.PRESERVED) {
      return this._applyStrictKeys(input, earlyReturn);
    }
    if (this.restShape !== null) {
      return this._applyRestKeys(input, earlyReturn);
    }
    return this._applyPreservedKeys(input, earlyReturn);
  }

  private _applyPreservedKeys(input: Dict, earlyReturn: boolean): ApplyResult {
    const { keys, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const value = input[key];
      const result = _valueShapes[i]._apply(value, earlyReturn);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        prependKey(result, key);

        if (earlyReturn) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if (_unsafe || issues === null) {
        if (input === output) {
          output = cloneEnumerableKeys(input);
        }
        output[key] = result.value;
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, earlyReturn);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  private _applyRestKeys(input: Dict, earlyReturn: boolean): ApplyResult {
    const { keys, restShape, _valueShapes, _applyChecks, _unsafe } = this;

    let issues: Issue[] | null = null;
    let output = input;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);
      const valueShape = index !== -1 ? _valueShapes[index] : restShape!;
      const result = valueShape._apply(value, earlyReturn);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        prependKey(result, key);

        if (earlyReturn) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if (_unsafe || issues === null) {
        if (input === output) {
          output = cloneEnumerableKeys(input);
        }
        output[key] = result.value;
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, earlyReturn);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  private _applyStrictKeys(input: Dict, earlyReturn: boolean): ApplyResult {
    const { keys, keysMode, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    let seenCount = 0;
    let seenFlags: Flags = 0;

    let unknownKeys: string[] | null = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);

      if (index !== -1) {
        seenCount++;
        seenFlags = setFlag(seenFlags, index);

        const result = _valueShapes[index]._apply(value, earlyReturn);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          prependKey(result, key);

          if (earlyReturn) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (_unsafe || issues === null) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          output[key] = result.value;
        }
        continue;
      }

      if (keysMode === KeysMode.EXACT) {
        if (unknownKeys !== null) {
          unknownKeys.push(key);
          continue;
        }

        unknownKeys = [key];

        if (earlyReturn) {
          break;
        }
        continue;
      }

      if (input === output && (_unsafe || issues === null)) {
        output = cloneKnownKeys(input, keys);
      }
    }

    if (unknownKeys !== null) {
      const issue = createIssue(CODE_UNKNOWN_KEYS, input, MESSAGE_UNKNOWN_KEYS, unknownKeys, undefined);

      if (earlyReturn) {
        return issues;
      }
      issues = pushIssue(issues, issue);
    }

    if (seenCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (isFlagSet(seenFlags, i)) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = _valueShapes[i]._apply(value, earlyReturn);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          prependKey(result, key);

          if (earlyReturn) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (_unsafe || issues === null) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          output[key] = result.value;
        }
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, earlyReturn);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  _applyAsync(input: unknown, earlyReturn: boolean): Promise<ApplyResult<InferObject<P, I, 'output'>>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        return raiseIssue(CODE_TYPE, input, undefined, TYPE_OBJECT, undefined);
      }

      const { keys, keysMode, restShape, _valueShapes, _applyChecks, _unsafe } = this;

      const keysLength = keys.length;
      const promises: any[] = [];

      let issues: Issue[] | null = null;
      let output = input;

      let seenCount = 0;
      let seenFlags: Flags = 0;

      let unknownKeys: string[] | null = null;

      for (const key in input) {
        const value = input[key];
        const index = keys.indexOf(key as ObjectKey<P>);

        let valueShape: AnyShape | null = restShape;

        if (index !== -1) {
          seenCount++;
          seenFlags = setFlag(seenFlags, index);

          valueShape = _valueShapes[index];
        }

        if (valueShape !== null) {
          promises.push(key, valueShape._applyAsync(value, earlyReturn));
          continue;
        }

        if (keysMode === KeysMode.EXACT) {
          if (unknownKeys !== null) {
            unknownKeys.push(key);
            continue;
          }

          unknownKeys = [key];

          if (earlyReturn) {
            break;
          }
          continue;
        }

        if (input === output) {
          output = cloneKnownKeys(input, keys);
        }
      }

      if (unknownKeys !== null) {
        const issue = createIssue(CODE_UNKNOWN_KEYS, input, MESSAGE_UNKNOWN_KEYS, unknownKeys, undefined);

        if (earlyReturn) {
          return issues;
        }
        issues = pushIssue(issues, issue);
      }

      if (seenCount !== keysLength) {
        for (let i = 0; i < keysLength; ++i) {
          if (isFlagSet(seenFlags, i)) {
            continue;
          }

          const key = keys[i];
          const value = input[key];

          promises.push(key, _valueShapes[i]._applyAsync(value, earlyReturn));
        }
      }

      const promise = Promise.all(promises).then(entries => {
        const entriesLength = 0;

        for (let i = 0; i < entriesLength; i += 2) {
          const key = entries[i];
          const result = entries[i + 1];

          if (result === null) {
            continue;
          }
          if (isArray(result)) {
            prependKey(result, key);

            if (earlyReturn) {
              return result;
            }
            issues = concatIssues(issues, result);
            continue;
          }
          if (_unsafe || issues === null) {
            if (input === output) {
              output = cloneEnumerableKeys(input);
            }
            output[key] = result.value;
          }
        }

        if (_applyChecks !== null && (_unsafe || issues === null)) {
          issues = _applyChecks(output, issues, earlyReturn);
        }
        if (issues === null && input !== output) {
          return ok(output as InferObject<P, I, 'output'>);
        }
        return issues;
      });

      resolve(promise);
    });
  }
}

export function setFlag(flags: Flags, index: number): Flags {
  if (typeof flags === 'number') {
    if (index < 32) {
      return flags | (1 << index);
    }
    flags = [flags, 0, 0];
  }

  flags[index >> 5] |= 1 << index % 32;
  return flags;
}

export function isFlagSet(flag: Flags, index: number): boolean {
  if (typeof flag === 'number') {
    return 0 !== flag >>> index;
  } else {
    return 0 !== flag[index >> 5] >>> index % 32;
  }
}

export function assignProperty(obj: Dict, key: string, value: unknown): void {
  if (key === '__proto__') {
    defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    obj[key] = value;
  }
}

export function cloneEnumerableKeys(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    assignProperty(output, key, input[key]);
  }
  return output;
}

export function cloneKnownKeys(input: Dict, keys: readonly string[]): Dict {
  const output: Dict = {};
  const keysLength = keys.length;

  for (let i = 0; i < keysLength; ++i) {
    const key = keys[i];

    if (key in input) {
      assignProperty(output, key, input[key]);
    }
  }
  return output;
}
