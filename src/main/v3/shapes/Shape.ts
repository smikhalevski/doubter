import {
  createObject,
  defineProperty,
  extendClass,
  isArray,
  isFinite,
  isObjectLike,
  isString,
  objectAssign,
  objectEntries,
  objectKeys,
  objectValues,
} from '../lang-utils';
import { Check, Dict, InputConstraintOptionsOrMessage, Issue } from '../shared-types';
import { isAsyncShapes, raiseIssue } from '../shape-utils';
import { CODE_TYPE } from './constants';
import { ApplyChecks, createApplyChecks } from './createApplyChecks';

export const INVALID: any = Symbol('invalid');

// ---------------------------------------------------------------------------------------------------------------------

export class ValidationError {
  constructor(public issues: Issue[]) {}
}

const validationErrorPrototype = ValidationError.prototype;

export function createValidationError(issues: Issue[]): ValidationError {
  const error = createObject(validationErrorPrototype);
  error.issues = issues;
  return error;
}

// ---------------------------------------------------------------------------------------------------------------------

export interface Ok<T> {
  ok: true;
  value: T;
}

export interface Err {
  ok: false;
  issues: Issue[];
}

const internalOk: Ok<any> = { ok: true, value: null };

export function syncOk<T>(value: T): Ok<T> {
  internalOk.value = value;
  return internalOk;
}

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

// ---------------------------------------------------------------------------------------------------------------------

export type AnyShape = Shape | Shape<never>;

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;

  async: boolean;

  try(input: unknown): Ok<O> | Err;

  parse(input: unknown): O;

  check(check: Check<O>): this;

  clone(): this;

  _apply(input: unknown, issues: Issue[] | null, earlyReturn: boolean): Ok<O> | Issue[] | null;
}

export class Shape<I = any, O = I> {
  protected _applyChecks: ApplyChecks | null = null;
  protected _checks: any[] = [];
}

const shapePrototype = Shape.prototype;

const typingPropertyDescriptor: PropertyDescriptor = {
  get() {
    throw new Error('Cannot be used at runtime');
  },
};

defineProperty(shapePrototype, 'input', typingPropertyDescriptor);

defineProperty(shapePrototype, 'output', typingPropertyDescriptor);

defineProperty(shapePrototype, 'try', {
  get() {
    const shape = this;

    const _try: Shape['try'] = function (this: Shape, input) {
      const result = shape._apply(input, null, false);

      if (result === null) {
        return ok(input);
      }
      if (isArray(result)) {
        return { ok: false, issues: result };
      }
      return ok(result.value);
    };

    defineProperty(this, 'try', { value: _try });

    return _try;
  },
});

defineProperty(shapePrototype, 'parse', {
  get() {
    const shape = this;

    const _parse: Shape['parse'] = function (this: Shape, input) {
      const result = shape._apply(input, null, false);

      if (result === null) {
        return input;
      }
      if (isArray(result)) {
        throw createValidationError(result);
      }
      return result.value;
    };

    defineProperty(this, 'parse', { value: _parse });

    return _parse;
  },
});

shapePrototype.check = function (this: Shape, check) {
  const checks = this._checks.slice(0);

  let id;
  let unsafe = false;

  // if (options != null) {
  //   id = options.id;
  //   unsafe = options.unsafe == true;
  // }

  if (id != null) {
    for (let i = 0; i < checks.length; i += 3) {
      if (checks[i] === id) {
        checks.splice(i, 3);
        break;
      }
    }
  }

  checks.push(id, unsafe, check);

  const shape = this.clone();

  shape._checks = checks;
  shape._applyChecks = createApplyChecks(checks);

  return shape;
};

// ---------------------------------------------------------------------------------------------------------------------

export interface StringShape2 extends Shape<string> {}

export class StringShape2 {
  constructor() {
    Shape.call(this);
  }
}

const stringShapePrototype = extendClass(StringShape2, Shape);

stringShapePrototype.async = false;

stringShapePrototype._apply = function (this: Shape, input, issues, earlyReturn) {
  const { _applyChecks } = this;

  if (!isString(input)) {
    return raiseIssue(issues, CODE_TYPE);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues, false, true, earlyReturn);
  }
  return issues;
};

// ---------------------------------------------------------------------------------------------------------------------

export interface NumberShape2 extends Shape<string> {}

export class NumberShape2 {
  constructor() {
    Shape.call(this);
  }
}

const numberShapePrototype = extendClass(NumberShape2, Shape);

numberShapePrototype.async = false;

numberShapePrototype._apply = function (this: Shape, input, issues, earlyReturn) {
  const { _applyChecks } = this;

  if (!isFinite(input)) {
    return raiseIssue(issues, CODE_TYPE);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues, false, true, earlyReturn);
  }
  return issues;
};

// ---------------------------------------------------------------------------------------------------------------------

export interface BooleanShape2 extends Shape<string> {}

export class BooleanShape2 {
  constructor() {
    Shape.call(this);
  }
}

const booleanShapePrototype = extendClass(BooleanShape2, Shape);

booleanShapePrototype.async = false;

booleanShapePrototype._apply = function (this: Shape, input, issues, earlyReturn) {
  const { _applyChecks } = this;

  if (typeof input !== 'boolean') {
    return raiseIssue(issues, CODE_TYPE);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues, false, true, earlyReturn);
  }
  return issues;
};

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

type AnyProperties = Dict<AnyShape>;

type ApplyKeys = (input: Dict, issues: Issue[] | null, earlyReturn: boolean) => Ok<any> | Issue[] | null;

type ApplyIndexer = (
  input: Dict,
  output: Dict,
  issues: Issue[] | null,
  valid: boolean,
  earlyReturn: boolean,
  applyChecks: ApplyChecks | null
) => Ok<any> | Issue[] | null;

export enum KeysMode {
  PRESERVED = 'preserved',
  STRIPPED = 'stripped',
  EXACT = 'exact',
}

export interface ObjectShape2<P extends AnyProperties, I extends AnyShape>
  extends Shape<InferObject<P, I, 'input'>, InferObject<P, I, 'output'>> {
  extend<T extends Dict<AnyShape>>(
    shape: ObjectShape2<T, AnyShape>
  ): ObjectShape2<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape2<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape2<Pick<P, K[number]>, I>;

  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape2<Omit<P, K[number]>, I>;

  exact(options?: InputConstraintOptionsOrMessage): ObjectShape2<P>;

  strip(): ObjectShape2<P>;

  preserve(): ObjectShape2<P>;

  index<I extends AnyShape>(indexerShape: I): ObjectShape2<P, I>;
}

export class ObjectShape2<P, I = Shape<never>> {
  readonly keys: readonly ObjectKey<P>[];

  protected _valueShapes: AnyShape[] = [];
  protected _applyKeys: ApplyKeys | null = null;
  protected _applyIndexer: ApplyIndexer | null = null;

  constructor(
    readonly shapes: Readonly<P>,
    readonly indexerShape: I | null = null,
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    Shape.call(this);

    this.async = (indexerShape !== null && indexerShape.async) || isAsyncShapes(objectValues(shapes));
    this.keys = objectKeys(shapes) as ObjectKey<P>[];

    this._valueShapes = objectValues(shapes);
  }
}

const objectShapePrototype = extendClass(ObjectShape2, Shape);

objectShapePrototype.extend = function (shape) {
  const shapes = objectAssign({}, this.shapes, shape instanceof ObjectShape2 ? shape.shapes : shape);

  return new ObjectShape2(shapes, this.indexerShape, this.keysMode);
};

objectShapePrototype.pick = function (this: ObjectShape2<AnyProperties>, ...keys) {
  const shapes: AnyProperties = {};

  for (const [key, shape] of objectEntries(this.shapes)) {
    if (keys.includes(key)) {
      shapes[key] = shape;
    }
  }
  return new ObjectShape2<any>(shapes, this.indexerShape, this.keysMode);
};

objectShapePrototype.omit = function (this: ObjectShape2<AnyProperties>, ...keys) {
  const shapes: AnyProperties = {};

  for (const [key, shape] of objectEntries(this.shapes)) {
    if (!keys.includes(key)) {
      shapes[key] = shape;
    }
  }
  return new ObjectShape2<any>(shapes, this.indexerShape, this.keysMode);
};

objectShapePrototype.exact = function (options) {
  return new ObjectShape2<AnyProperties>(this.shapes, null, KeysMode.EXACT);
};

objectShapePrototype.strip = function () {
  return new ObjectShape2<AnyProperties>(this.shapes, null, KeysMode.STRIPPED);
};

objectShapePrototype.preserve = function () {
  return new ObjectShape2<AnyProperties>(this.shapes, null, KeysMode.PRESERVED);
};

objectShapePrototype.index = function (indexerShape) {
  return new ObjectShape2(this.shapes, indexerShape, KeysMode.PRESERVED);
};

objectShapePrototype._apply = function (this: ObjectShape2<AnyProperties>, input, issues, earlyReturn) {
  if (!isObjectLike(input)) {
    return raiseIssue(issues, CODE_TYPE);
  }

  const { keys, _valueShapes, _applyKeys, _applyIndexer, _applyChecks } = this;
  const keysLength = keys.length;

  let valid = true;
  let output = input;

  if (_applyKeys !== null) {
    const result = _applyKeys(input, issues, earlyReturn);

    if (result !== null) {
      if (isArray(result)) {
        if (earlyReturn) {
          return result;
        }
        valid = false;
        issues = result;
      } else {
        output = result.value;
      }
    }
  }

  for (let i = 0; i < keysLength; ++i) {
    const key = keys[i];
    const inputValue = input[key];
    const result = _valueShapes[i]._apply(inputValue, issues, earlyReturn);

    if (result === null) {
      continue;
    }

    let outputValue = INVALID;

    if (isArray(result)) {
      if (earlyReturn) {
        return result;
      }
      valid = false;
      issues = result;
    } else {
      outputValue = result.value;
    }
    if (output === input) {
      output = cloneDict(input);
    }
    output[key] = outputValue;
  }

  if (_applyIndexer !== null) {
    return _applyIndexer(input, output, issues, valid, earlyReturn, _applyChecks);
  }
  if (_applyChecks !== null) {
    return _applyChecks(output, issues, output !== input, valid, earlyReturn);
  }

  return issues === null && output !== input ? syncOk(output) : issues;
};

function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}
