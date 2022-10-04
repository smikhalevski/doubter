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
import {
  Check,
  Dict,
  IdentifiableConstraintOptions,
  InputConstraintOptionsOrMessage,
  Issue,
  OutputConstraintOptionsOrMessage,
} from '../shared-types';
import { addCheck, createIssue, isAsyncShapes, raiseIssue, toPartialIssue, unshiftKey } from '../shape-utils';
import { ApplyChecks, createApplyChecks } from './createApplyChecks';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_TYPE,
  CODE_UNKNOWN_KEYS,
  MESSAGE_BOOLEAN_TYPE,
  MESSAGE_NUMBER_TYPE,
  MESSAGE_OBJECT_TYPE,
  MESSAGE_STRING_MAX,
  MESSAGE_STRING_MIN,
  MESSAGE_STRING_TYPE,
  MESSAGE_UNKNOWN_KEYS,
  TYPE_BOOLEAN,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../../shapes/constants';
import { assignObject } from '../../lang-utils';

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

const globalOk: Ok<any> = { ok: true, value: null };

export function internalOk<T>(value: T): Ok<T> {
  globalOk.value = value;
  return globalOk;
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

  check(check: Check<O>, options?: IdentifiableConstraintOptions): this;

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

shapePrototype.check = function (this: Shape, check, options) {
  const checks = this._checks.slice(0);

  let id;
  let unsafe = false;

  if (options != null) {
    id = options.id;
    unsafe = options.unsafe == true;
  }

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

shapePrototype.clone = function (this: Shape) {
  return assignObject(createObject(Object.getPrototypeOf(this)), this);
};

// ---------------------------------------------------------------------------------------------------------------------

export interface StringShape2 extends Shape<string> {
  length(length: number, options?: OutputConstraintOptionsOrMessage): this;

  min(length: number, options?: OutputConstraintOptionsOrMessage): this;

  max(length: number, options?: OutputConstraintOptionsOrMessage): this;
}

export class StringShape2 {
  protected _typeMessage;
  protected _typeMeta;

  constructor(options?: InputConstraintOptionsOrMessage) {
    Shape.call(this);

    const issue = toPartialIssue(MESSAGE_STRING_TYPE, options);
    this._typeMessage = issue.message;
    this._typeMeta = issue.meta;
  }
}

const stringShapePrototype = extendClass(StringShape2, Shape);

stringShapePrototype.async = false;

stringShapePrototype.length = function (this: StringShape2, length, options) {
  return this.min(length, options).max(length, options);
};

stringShapePrototype.min = function (this: StringShape2, length, options) {
  const { message, meta } = toPartialIssue(MESSAGE_STRING_MIN, options, length);

  return addCheck(this, CODE_STRING_MIN, options, input => {
    if (input.length < length) {
      return createIssue(CODE_STRING_MIN, input, message, length, meta);
    }
  });
};

stringShapePrototype.max = function (this: StringShape2, length, options) {
  const { message, meta } = toPartialIssue(MESSAGE_STRING_MAX, options, length);

  return addCheck(this, CODE_STRING_MAX, options, input => {
    if (input.length > length) {
      return createIssue(CODE_STRING_MAX, input, message, length, meta);
    }
  });
};

stringShapePrototype._apply = function (this: StringShape2, input, issues, earlyReturn) {
  const { _applyChecks } = this;

  if (!isString(input)) {
    return raiseIssue(issues, CODE_TYPE, input, this._typeMessage, TYPE_STRING, this._typeMeta);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues, false, true, earlyReturn);
  }
  return issues;
};

// ---------------------------------------------------------------------------------------------------------------------

export interface NumberShape2 extends Shape<string> {}

export class NumberShape2 {
  protected _typeIssue;

  constructor(options?: InputConstraintOptionsOrMessage) {
    Shape.call(this);

    this._typeIssue = toPartialIssue(MESSAGE_NUMBER_TYPE, options);
  }
}

const numberShapePrototype = extendClass(NumberShape2, Shape);

numberShapePrototype.async = false;

numberShapePrototype._apply = function (this: NumberShape2, input, issues, earlyReturn) {
  const { _applyChecks } = this;

  if (!isFinite(input)) {
    return raiseIssue(issues, CODE_TYPE, input, this._typeIssue.message, TYPE_NUMBER, this._typeIssue.meta);
  }
  if (_applyChecks !== null) {
    return _applyChecks(input, issues, false, true, earlyReturn);
  }
  return issues;
};

// ---------------------------------------------------------------------------------------------------------------------

export interface BooleanShape2 extends Shape<string> {}

export class BooleanShape2 {
  protected _typeIssue;

  constructor(options?: InputConstraintOptionsOrMessage) {
    Shape.call(this);

    this._typeIssue = toPartialIssue(MESSAGE_BOOLEAN_TYPE, options);
  }
}

const booleanShapePrototype = extendClass(BooleanShape2, Shape);

booleanShapePrototype.async = false;

booleanShapePrototype._apply = function (this: BooleanShape2, input, issues, earlyReturn) {
  const { _applyChecks } = this;

  if (typeof input !== 'boolean') {
    return raiseIssue(issues, CODE_TYPE, input, this._typeIssue.message, TYPE_BOOLEAN, this._typeIssue.meta);
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

export const enum KeysMode {
  PRESERVED,
  STRIPPED,
  EXACT,
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

  _exactKeys(input: Dict, issues: Issue[] | null): Issue[] | null;

  _stripKeys(input: Dict): Dict;

  _applyIndexer(
    input: Dict,
    output: Dict,
    issues: Issue[] | null,
    valid: boolean,
    earlyReturn: boolean
  ): Ok<any> | Issue[] | null;
}

export class ObjectShape2<P, I = Shape<never>> {
  readonly shapes;
  readonly indexerShape;
  readonly keys;
  readonly keysMode;

  protected _options;
  protected _keySet;
  protected _valueShapes: Shape[];
  protected _exactMessage: unknown;
  protected _exactMeta: unknown;
  protected _typeIssue;

  constructor(
    shapes: Readonly<P>,
    indexerShape: I | null = null,
    options?: InputConstraintOptionsOrMessage,
    keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    Shape.call(this);

    const keys = objectKeys(shapes);
    const valueShapes = objectValues(shapes);

    this.async = (indexerShape !== null && indexerShape.async) || isAsyncShapes(valueShapes);
    this.shapes = shapes;
    this.indexerShape = indexerShape;
    this.keys = keys as ObjectKey<P>[];
    this.keysMode = keysMode;

    this._options = options;
    this._keySet = new Set(keys);
    this._valueShapes = valueShapes;
    this._exactMessage = null;
    this._exactMeta = null;
    this._typeIssue = toPartialIssue(MESSAGE_OBJECT_TYPE, options);
  }
}

const objectShapePrototype = extendClass(ObjectShape2, Shape);

objectShapePrototype.extend = function (this: ObjectShape2<AnyProperties>, shape) {
  const shapes = objectAssign({}, this.shapes, shape instanceof ObjectShape2 ? shape.shapes : shape);

  return new ObjectShape2(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
};

objectShapePrototype.pick = function (this: ObjectShape2<AnyProperties>, ...keys) {
  const shapes: AnyProperties = {};

  for (const [key, shape] of objectEntries(this.shapes)) {
    if (keys.includes(key)) {
      shapes[key] = shape;
    }
  }
  return new ObjectShape2<any>(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
};

objectShapePrototype.omit = function (this: ObjectShape2<AnyProperties>, ...keys) {
  const shapes: AnyProperties = {};

  for (const [key, shape] of objectEntries(this.shapes)) {
    if (!keys.includes(key)) {
      shapes[key] = shape;
    }
  }
  return new ObjectShape2<any>(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
};

objectShapePrototype.exact = function (this: ObjectShape2<AnyProperties>, options) {
  const issue = toPartialIssue(MESSAGE_UNKNOWN_KEYS, options);
  const shape = new ObjectShape2<AnyProperties>(this.shapes, null, this._options, KeysMode.EXACT);

  shape._exactMessage = issue.message;
  shape._exactMeta = issue.meta;

  return shape;
};

objectShapePrototype.strip = function (this: ObjectShape2<AnyProperties>) {
  return new ObjectShape2<AnyProperties>(this.shapes, null, this._options, KeysMode.STRIPPED);
};

objectShapePrototype.preserve = function (this: ObjectShape2<AnyProperties>) {
  return new ObjectShape2<AnyProperties>(this.shapes, null, this._options, KeysMode.PRESERVED);
};

objectShapePrototype.index = function (this: ObjectShape2<AnyProperties>, indexerShape) {
  return new ObjectShape2(this.shapes, indexerShape, this._options, KeysMode.PRESERVED);
};

objectShapePrototype._apply = function (this: ObjectShape2<AnyProperties>, input, issues, earlyReturn) {
  if (!isObjectLike(input)) {
    return raiseIssue(issues, CODE_TYPE, input, this._typeIssue.message, TYPE_OBJECT, this._typeIssue.meta);
  }

  const { keys, _valueShapes, keysMode, indexerShape, _applyChecks } = this;
  const keysLength = keys.length;

  let valid = true;
  let output = input;

  if (keysMode !== KeysMode.PRESERVED) {
    if (keysMode === KeysMode.EXACT) {
      issues = this._exactKeys(input, issues);

      if (earlyReturn && issues !== null) {
        return issues;
      }
    } else {
      output = this._stripKeys(input);
    }
  }

  let offset = issues === null ? 0 : issues.length;

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
      issues = unshiftKey(result, offset, key);
      offset = issues.length;
    } else {
      outputValue = result.value;
    }

    if (output === input) {
      output = cloneDict(input);
    }
    output[key] = outputValue;
  }

  if (indexerShape !== null) {
    return this._applyIndexer(input, output, issues, valid, earlyReturn);
  }
  if (_applyChecks !== null) {
    return _applyChecks(output, issues, output !== input, valid, earlyReturn);
  }

  return issues === null && output !== input ? internalOk(output) : issues;
};

objectShapePrototype._exactKeys = function (this: ObjectShape2<AnyProperties>, input, issues) {
  const { _keySet } = this;

  let unknownKeys: string[] | null = null;

  for (const key in input) {
    if (!_keySet.has(key)) {
      (unknownKeys ||= []).push(key);
    }
  }
  if (unknownKeys !== null) {
    return raiseIssue(issues, CODE_UNKNOWN_KEYS, input, this._exactMessage, unknownKeys, this._exactMeta);
  }
  return issues;
};

objectShapePrototype._stripKeys = function (this: ObjectShape2<AnyProperties>, input) {
  const { _keySet } = this;

  for (const key in input) {
    if (_keySet.has(key)) {
      continue;
    }

    const { keys } = this;
    const keysLength = keys.length;
    const output: Dict = {};

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];

      if (key in input) {
        output[key] = input[key];
      }
    }
    return output;
  }
  return input;
};

objectShapePrototype._applyIndexer = function (
  this: ObjectShape2<AnyProperties>,
  input,
  output,
  issues,
  valid,
  earlyReturn
) {
  const { _keySet, indexerShape, _applyChecks } = this;

  if (valid || !earlyReturn) {
    let offset = issues === null ? 0 : issues.length;

    for (const key in input) {
      if (_keySet.has(key)) {
        continue;
      }

      const inputValue = input[key];
      const result = indexerShape!._apply(inputValue, issues, earlyReturn);

      if (result === null) {
        continue;
      }

      let outputValue = INVALID;

      if (isArray(result)) {
        if (earlyReturn) {
          return result;
        }
        valid = false;
        issues = unshiftKey(result, offset, key);
        offset = issues.length;
      } else {
        outputValue = result.value;
      }

      if (output === input) {
        output = cloneDict(input);
      }
      output[key] = outputValue;
    }
  }

  if (_applyChecks !== null) {
    return _applyChecks(output, issues, output !== input, valid, earlyReturn);
  }

  return issues === null && output !== input ? internalOk(output) : issues;
};

function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}
