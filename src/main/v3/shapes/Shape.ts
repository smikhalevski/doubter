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
import { ApplyChecks, Check, Dict, InputConstraintOptionsOrMessage, Issue } from '../shared-types';
import { isAsyncShapes, raiseIssue, throwError } from '../shape-utils';
import { CODE_TYPE } from './constants';

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

const ok: Ok<any> = { ok: true, value: null };

export function syncOk<T>(value: T): Ok<T> {
  ok.value = value;
  return ok;
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

  _apply(input: unknown, issues: Issue[] | null): Ok<O> | Issue[] | true;
}

export class Shape<I = any, O = I> {
  protected _applyChecks: ApplyChecks | null = null;
  protected _checks: any[] = [];
}

const shapePrototype = Shape.prototype;

const typingPropertyDescriptor: PropertyDescriptor = {
  get() {
    throwError('Cannot be used at runtime');
  },
};

const forbiddenPropertyDescriptor: PropertyDescriptor = {
  value: () => {
    throwError('Shape cannot be used in a synchronous context');
  },
};

defineProperty(shapePrototype, 'input', typingPropertyDescriptor);

defineProperty(shapePrototype, 'output', typingPropertyDescriptor);

defineProperty(shapePrototype, 'try', {
  get() {
    const shape = this;

    const value: Shape['try'] = function (this: Shape, input) {
      const result = shape._apply(input, null);

      if (result === true) {
        return syncOk(input);
      }
      if (isArray(result)) {
        return { ok: false, issues: result };
      }
      return result;
    };

    defineProperty(this, 'try', { value });

    return value;
  },
});

defineProperty(shapePrototype, 'parse', {
  get() {
    const shape = this;

    const value: Shape['parse'] = function (this: Shape, input) {
      const result = shape._apply(input, null);

      if (result === true) {
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

export interface StringShape2 extends Shape<string> {}

export class StringShape2 {
  constructor() {
    Shape.call(this);
  }
}

const stringShapePrototype = extendClass(StringShape2, Shape);

stringShapePrototype.async = false;

stringShapePrototype._apply = function (this: Shape, input, issues) {
  const { _applyChecks } = this;

  if (!isString(input)) {
    return raiseIssue(issues, CODE_TYPE);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues);
  }
  return true;
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

numberShapePrototype._apply = function (this: Shape, input, issues) {
  const { _applyChecks } = this;

  if (!isFinite(input)) {
    return raiseIssue(issues, CODE_TYPE);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues);
  }
  return true;
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

booleanShapePrototype._apply = function (this: Shape, input, issues) {
  const { _applyChecks } = this;

  if (typeof input !== 'boolean') {
    return raiseIssue(issues, CODE_TYPE);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues);
  }
  return true;
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

type ApplyKeys = (input: Dict, issues: Issue[] | null) => true | Ok<any> | Issue[];

type ApplyIndexer = (
  input: Dict,
  output: Dict,
  issues: Issue[] | null,
  applyChecks: ApplyChecks | null
) => true | Ok<any> | Issue[];

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

objectShapePrototype._apply = function (this: ObjectShape2<AnyProperties>, input, issues) {
  if (!isObjectLike(input)) {
    return raiseIssue(issues, CODE_TYPE);
  }

  const { keys, _valueShapes, _applyKeys, _applyIndexer, _applyChecks } = this;
  const keysLength = keys.length;

  let output = input;

  if (_applyKeys !== null) {
    const result = _applyKeys(input, issues);

    if (result !== true) {
      if (isArray(result)) {
        issues = result;
      } else {
        output = result.value;
      }
    }
  }

  for (let i = 0; i < keysLength; ++i) {
    const key = keys[i];
    const inputValue = input[key];
    const result = _valueShapes[i]._apply(inputValue, issues);

    if (result === true) {
      continue;
    }
    if (isArray(result)) {
      issues = result;
      continue;
    }
    if (output === input) {
      output = cloneDict(input);
    }
    output[key] = result.value;
  }

  if (_applyIndexer !== null) {
    return _applyIndexer(input, output, issues, _applyChecks);
  }
  if (_applyChecks !== null) {
    return _applyChecks(output, issues);
  }
  if (issues !== null) {
    return issues;
  }
  if (output !== input) {
    return syncOk(output);
  }
  return true;
};

function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}
