import {
  createObject,
  defineProperty,
  isArray,
  isFinite,
  isObjectLike,
  isString,
  objectAssign,
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

export interface ShapeLike<O = any> {
  _apply: Shape<unknown, O>['_apply'];
}

export interface Shape<I, O> {
  readonly input: I;
  readonly output: O;

  try(input: unknown): Ok<O> | Err;

  parse(input: unknown): O;
}

export class Shape<I = any, O = I> {
  protected _applyChecks: ApplyChecks | null = null;
  protected _checks: any[] = [];

  constructor(readonly async: boolean) {}

  check(check: Check<O>, options?: IdentifiableConstraintOptions): this {
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
  }

  clone(): this {
    return assignObject(createObject(Object.getPrototypeOf(this)), this);
  }

  protected _apply(input: unknown, issues: Issue[] | null, earlyReturn: boolean): Ok<O> | Issue[] | null {
    const { _applyChecks } = this;
    if (_applyChecks !== null) {
      return _applyChecks(input, issues, false, true, earlyReturn);
    }
    return issues;
  }
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
    const boundShape = this;

    const value: Shape['try'] = function (this: Shape, input) {
      const result = boundShape._apply(input, null, false);

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
    const boundShape = this;

    const value: Shape['parse'] = function (this: Shape, input) {
      const result = boundShape._apply(input, null, false);

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
  protected _typeMessage;
  protected _typeMeta;

  constructor(options?: InputConstraintOptionsOrMessage) {
    super(false);

    const issue = toPartialIssue(MESSAGE_STRING_TYPE, options);
    this._typeMessage = issue.message;
    this._typeMeta = issue.meta;
  }

  length(length: number, options?: OutputConstraintOptionsOrMessage): this {
    return this.min(length, options).max(length, options);
  }

  min(length: number, options?: OutputConstraintOptionsOrMessage): this {
    const { message, meta } = toPartialIssue(MESSAGE_STRING_MIN, options, length);

    return addCheck(this, CODE_STRING_MIN, options, input => {
      if (input.length < length) {
        return createIssue(CODE_STRING_MIN, input, message, length, meta);
      }
    });
  }

  max(length: number, options?: OutputConstraintOptionsOrMessage): this {
    const { message, meta } = toPartialIssue(MESSAGE_STRING_MAX, options, length);

    return addCheck(this, CODE_STRING_MAX, options, input => {
      if (input.length > length) {
        return createIssue(CODE_STRING_MAX, input, message, length, meta);
      }
    });
  }

  protected _apply(input: unknown, issues: Issue[] | null, earlyReturn: boolean): Ok<string> | Issue[] | null {
    const { _applyChecks } = this;

    if (!isString(input)) {
      return raiseIssue(issues, CODE_TYPE, input, this._typeMessage, TYPE_STRING, this._typeMeta);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, issues, false, true, earlyReturn);
    }
    return issues;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export class NumberShape extends Shape<number> {
  protected _typeIssue;

  constructor(options?: InputConstraintOptionsOrMessage) {
    super(false);

    this._typeIssue = toPartialIssue(MESSAGE_NUMBER_TYPE, options);
  }

  protected _apply(input: unknown, issues: Issue[] | null, earlyReturn: boolean): Ok<number> | Issue[] | null {
    const { _applyChecks } = this;

    if (!isFinite(input)) {
      return raiseIssue(issues, CODE_TYPE, input, this._typeIssue.message, TYPE_NUMBER, this._typeIssue.meta);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, issues, false, true, earlyReturn);
    }
    return issues;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export class BooleanShape extends Shape<boolean> {
  protected _typeIssue;

  constructor(options?: InputConstraintOptionsOrMessage) {
    super(false);

    this._typeIssue = toPartialIssue(MESSAGE_BOOLEAN_TYPE, options);
  }

  protected _apply(input: unknown, issues: Issue[] | null, earlyReturn: boolean): Ok<boolean> | Issue[] | null {
    const { _applyChecks } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(issues, CODE_TYPE, input, this._typeIssue.message, TYPE_BOOLEAN, this._typeIssue.meta);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, issues, false, true, earlyReturn);
    }
    return issues;
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

type AnyProperties = Dict<AnyShape>;

export const enum KeysMode {
  PRESERVED,
  STRIPPED,
  EXACT,
}

export class ObjectShape<P extends AnyProperties, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  readonly keys;

  protected _options;
  protected _valueShapes: Shape[];
  protected _exactMessage: unknown;
  protected _exactMeta: unknown;
  protected _typeIssue;

  constructor(
    readonly shapes: Readonly<P>,
    readonly indexerShape: I | null = null,
    readonly options?: InputConstraintOptionsOrMessage,
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    const keys = objectKeys(shapes);
    const valueShapes = objectValues(shapes);

    super((indexerShape !== null && indexerShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys as ObjectKey<P>[];

    this._options = options;
    this._valueShapes = valueShapes;
    this._exactMessage = null;
    this._exactMeta = null;
    this._typeIssue = toPartialIssue(MESSAGE_OBJECT_TYPE, options);
  }

  extend<T extends Dict<AnyShape>>(
    shape: ObjectShape<T, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any, AnyShape> | Dict<AnyShape>): ObjectShape<any, I> {
    const shapes = objectAssign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
  }

  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const shapes: AnyProperties = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
  }

  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const shapes: AnyProperties = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (!keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }
    return new ObjectShape<any, I>(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
  }

  exact(options?: InputConstraintOptionsOrMessage): ObjectShape<P> {
    const issue = toPartialIssue(MESSAGE_UNKNOWN_KEYS, options);
    const shape = new ObjectShape<P>(this.shapes, null, this._options, KeysMode.EXACT);

    shape._exactMessage = issue.message;
    shape._exactMeta = issue.meta;

    return shape;
  }

  strip(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options, KeysMode.STRIPPED);
  }

  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options, KeysMode.PRESERVED);
  }

  index<I extends AnyShape>(indexerShape: I): ObjectShape<P, I> {
    return new ObjectShape(this.shapes, indexerShape, this._options, KeysMode.PRESERVED);
  }

  protected _apply(
    input: unknown,
    issues: Issue[] | null,
    earlyReturn: boolean
  ): Ok<InferObject<P, I, 'output'>> | Issue[] | null {
    if (!isObjectLike(input)) {
      return raiseIssue(issues, CODE_TYPE, input, this._typeIssue.message, TYPE_OBJECT, this._typeIssue.meta);
    }

    const { keys, _valueShapes, keysMode, indexerShape, _applyChecks } = this;

    let output = input;

    const offset = issues === null ? 0 : issues.length;

    let lastOffset = offset;

    if (keysMode === KeysMode.EXACT) {
      issues = exactKeys(input, issues, keys);

      if (issues !== null) {
        if (earlyReturn) {
          return issues;
        }
        lastOffset = issues.length;
      }
    }
    if (keysMode === KeysMode.STRIPPED) {
      output = stripKeys(input, keys);
    }

    const keysLength = keys.length;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const value = input[key];
      const result = (_valueShapes[i] as unknown as ShapeLike)._apply(value, issues, earlyReturn);

      if (result === null) {
        continue;
      }

      if (output === input) {
        output = cloneDict(input);
      }
      if (isArray(result)) {
        if (earlyReturn) {
          return result;
        }
        lastOffset += unshiftKey(result, offset, key);
        output[key] = INVALID;
      } else {
        output[key] = result.value;
      }
    }

    if (indexerShape !== null) {
      return applyIndexer(input, output, issues, offset, earlyReturn, keys, indexerShape, _applyChecks);
    }
    if (_applyChecks !== null) {
      return _applyChecks(output, issues, output !== input, lastOffset === offset, earlyReturn);
    }

    return issues === null && output !== input ? internalOk(output as InferObject<P, I, 'output'>) : issues;
  }
}

function stripKeys(input: Dict, keys: string[]): Dict {
  for (const key in input) {
    if (keys.includes(key)) {
      continue;
    }

    const keysLength = keys.length;
    const output: Dict = {};

    for (let i = 0; i < keysLength; ++i) {
      const key: string = keys[i];

      if (key in input) {
        output[key] = input[key];
      }
    }
    return output;
  }
  return input;
}

function exactKeys(input: Dict, issues: Issue[] | null, keys: string[]): Issue[] | null {
  let unknownKeys: string[] | null = null;

  for (const key in input) {
    if (!keys.includes(key)) {
      (unknownKeys ||= []).push(key);
    }
  }
  if (unknownKeys !== null) {
    return raiseIssue(issues, CODE_UNKNOWN_KEYS, input, undefined, unknownKeys, undefined);
  }
  return issues;
}

function applyIndexer(
  input: Dict,
  output: Dict,
  issues: Issue[] | null,
  offset: number,
  earlyReturn: boolean,
  keys: string[],
  indexerShape: AnyShape,
  applyChecks: ApplyChecks | null
): Ok<any> | Issue[] | null {
  let lastOffset = offset;

  for (const key in input) {
    if (keys.includes(key)) {
      continue;
    }

    const result = (indexerShape as unknown as ShapeLike)._apply(input[key], issues, earlyReturn);

    if (result === null) {
      continue;
    }

    if (output === input) {
      output = cloneDict(input);
    }
    if (isArray(result)) {
      if (earlyReturn) {
        return result;
      }
      lastOffset += unshiftKey(result, lastOffset, key);
      output[key] = INVALID;
    } else {
      output[key] = result.value;
    }
  }

  if (applyChecks !== null) {
    return applyChecks(output, issues, output !== input, lastOffset === offset, earlyReturn);
  }

  return issues === null && output !== input ? internalOk(output) : issues;
}

function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}
