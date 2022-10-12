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

// ---------------------------------------------------------------------------------------------------------------------

export type AnyShape = Shape | Shape<never>;

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;

  try(input: unknown): Ok<O> | Err;

  parse(input: unknown): O;

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

  _apply(input: unknown, earlyReturn: boolean): Ok<O> | Issue[] | null {
    const { _applyChecks } = this;
    if (_applyChecks !== null) {
      return _applyChecks(input, null, earlyReturn);
    }
    return null;
  }
}

const shapePrototype = Shape.prototype;

defineProperty(shapePrototype, 'try', {
  get() {
    const shape = this;

    const value: Shape['try'] = function (this: Shape, input) {
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

    const value: Shape['parse'] = function (this: Shape, input) {
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

// ---------------------------------------------------------------------------------------------------------------------

export class StringShape extends Shape<string> {
  _apply(input: unknown, earlyReturn: boolean): Ok<string> | Issue[] | null {
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
  _apply(input: unknown, earlyReturn: boolean): Ok<number> | Issue[] | null {
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
  _apply(input: unknown, earlyReturn: boolean): Ok<boolean> | Issue[] | null {
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

type Channel = 'input' | 'output';

type InferObject<P extends Dict<AnyShape>, I extends AnyShape, C extends Channel> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferIndexer<I, C>
>;

type InferIndexer<I extends AnyShape, C extends Channel> = I extends Shape ? { [indexer: string]: I[C] } : unknown;

type ObjectKey<T extends object> = StringifyPropertyKey<keyof T>;

type StringifyPropertyKey<K extends PropertyKey> = K extends symbol ? never : K extends number ? `${K}` : K;

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type Bits = number[] | number;

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
    readonly indexerShape: I | null = null,
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    const keys = objectKeys(shapes);
    const valueShapes = objectValues(shapes);

    super((indexerShape !== null && indexerShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys as ObjectKey<P>[];

    this._valueShapes = valueShapes;
  }

  extend<T extends Dict<AnyShape>>(shape: ObjectShape<T, any>): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any> | Dict): ObjectShape<any, I> {
    const shapes = objectAssign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.indexerShape, KeysMode.PRESERVED);
  }

  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, KeysMode.PRESERVED);
  }

  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (!keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }
    return new ObjectShape<any, I>(shapes, this.indexerShape, KeysMode.PRESERVED);
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

  index<I extends AnyShape>(indexerShape: I): ObjectShape<P, I> {
    return new ObjectShape(this.shapes, indexerShape, KeysMode.PRESERVED);
  }

  _apply(input: unknown, earlyReturn: boolean): Ok<InferObject<P, I, 'output'>> | Issue[] | null {
    if (!isObjectLike(input)) {
      return raiseIssue(CODE_TYPE, input, undefined, TYPE_OBJECT, undefined);
    }

    if (this.keysMode === KeysMode.PRESERVED && this.indexerShape === null) {
      return this._applyLoose(input, earlyReturn);
    }

    return this._applyStrict(input, earlyReturn);
  }

  private _applyLoose(input: Dict, earlyReturn: boolean): Ok<any> | Issue[] | null {
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
          output = cloneDict(input);
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

  private _applyStrict(input: Dict, earlyReturn: boolean): Ok<any> | Issue[] | null {
    const { keys, keysMode, indexerShape, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    let seenCount = 0;
    let seenBits: Bits = 0;

    let unknownKeys: string[] | null = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);

      let valueShape: AnyShape | null = indexerShape;

      if (index !== -1) {
        seenCount++;
        seenBits = setBit(seenBits, index);

        valueShape = _valueShapes[index];
      }

      if (valueShape !== null) {
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
            output = keysMode === KeysMode.STRIPPED ? pickKeys(input, keys) : cloneDict(input);
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
        const issue = createIssue(CODE_UNKNOWN_KEYS, input, MESSAGE_UNKNOWN_KEYS, unknownKeys, undefined);

        if (earlyReturn) {
          return [issue];
        }
        issues = pushIssue(issues, issue);
        continue;
      }

      if (input === output && (_unsafe || issues === null)) {
        output = pickKeys(input, keys);
      }
    }

    if (seenCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (getBit(seenBits, i) === 1) {
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
            output = keysMode === KeysMode.STRIPPED ? pickKeys(input, keys) : cloneDict(input);
          }
          output[key] = result.value;
        }
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, earlyReturn);
    }
    if (input === output || issues !== null) {
      return issues;
    }
    return ok(output);
  }
}

function setBit(bits: Bits, index: number): Bits {
  if (typeof bits === 'number') {
    if (index < 32) {
      return bits | (1 << index);
    }
    bits = [bits, 0, 0];
  }

  bits[index >> 5] |= 1 << index % 32;
  return bits;
}

function getBit(bits: Bits, index: number): number {
  if (typeof bits === 'number') {
    return (bits >>> index) & 1;
  } else {
    return (bits[index >> 5] >>> index % 32) & 1;
  }
}

function safeSet(obj: Dict, key: string, value: unknown): void {
  if (key === '__proto__') {
    defineProperty(obj, key, { value, writable: true, enumerable: true, configurable: true });
  } else {
    obj[key] = value;
  }
}

function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    safeSet(output, key, input[key]);
  }
  return output;
}

function pickKeys(input: Dict, keys: readonly string[]): Dict {
  const output: Dict = {};
  const keysLength = keys.length;

  for (let i = 0; i < keysLength; ++i) {
    const key = keys[i];

    if (key in input) {
      safeSet(output, key, input[key]);
    }
  }
  return output;
}
