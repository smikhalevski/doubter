import {
  createObject,
  defineProperty,
  isFinite,
  isObjectLike,
  isString,
  objectAssign,
  objectKeys,
  objectValues,
} from '../lang-utils';
import { Check, Dict, IdentifiableConstraintOptions, InputConstraintOptionsOrMessage, Issue } from '../shared-types';
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
import { isAsyncShapes, raiseIssue, unshiftKey } from '../shape-utils';
import { createValidationError } from './ValidationError';

export const INVALID: any = Symbol('invalid');

// ---------------------------------------------------------------------------------------------------------------------

export interface IParserContext {
  issues: Issue[];
  keyBits: number;
  earlyReturn: boolean;
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

  constructor(readonly async: boolean) {}

  // check(check: Check<O>, options?: IdentifiableConstraintOptions): this {
  //   const checks = this._checks.slice(0);
  //
  //   let id;
  //   let unsafe = false;
  //
  //   if (options != null) {
  //     id = options.id;
  //     unsafe = options.unsafe == true;
  //   }
  //
  //   if (id != null) {
  //     for (let i = 0; i < checks.length; i += 3) {
  //       if (checks[i] === id) {
  //         checks.splice(i, 3);
  //         break;
  //       }
  //     }
  //   }
  //
  //   checks.push(id, unsafe, check);
  //
  //   const shape = this.clone();
  //
  //   shape._checks = checks;
  //   shape._applyChecks = createApplyChecks(checks);
  //
  //   return shape;
  // }

  clone(): this {
    return objectAssign(createObject(Object.getPrototypeOf(this)), this);
  }

  _apply(input: unknown, context: IParserContext): Ok<O> | boolean {
    const { _applyChecks } = this;
    if (_applyChecks !== null) {
      return _applyChecks(input, context);
    }
    return true;
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

    let globalContext: IParserContext = { issues: [], keyBits: 0, earlyReturn: false };

    const value: Shape['try'] = function (this: Shape, input) {
      const context = globalContext || { issues: [], keyBits: 0, earlyReturn: false };

      const result = boundShape._apply(input, context);

      globalContext = context;

      if (result === true) {
        return ok(input);
      }
      if (result === false) {
        return { ok: false, issues: context.issues };
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

    let globalContext: IParserContext = { issues: [], keyBits: 0, earlyReturn: false };

    const value: Shape['parse'] = function (this: Shape, input) {
      const context = globalContext || { issues: [], keyBits: 0, earlyReturn: false };

      const result = boundShape._apply(input, context);

      globalContext = context;

      if (result === true) {
        return input;
      }
      if (result === false) {
        throw createValidationError(context.issues);
      }
      return result.value;
    };

    defineProperty(this, 'parse', { value });

    return value;
  },
});

// ---------------------------------------------------------------------------------------------------------------------

export class StringShape extends Shape<string> {
  constructor(options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  // length(length: number, options?: OutputConstraintOptionsOrMessage): this {
  //   return this.min(length, options).max(length, options);
  // }
  //
  // min(length: number, options?: OutputConstraintOptionsOrMessage): this {
  //   return addCheck(this, CODE_STRING_MIN, options, input => {
  //     if (input.length < length) {
  //       return createIssue(CODE_STRING_MIN, input, undefined, length, undefined);
  //     }
  //   });
  // }
  //
  // max(length: number, options?: OutputConstraintOptionsOrMessage): this {
  //   return addCheck(this, CODE_STRING_MAX, options, input => {
  //     if (input.length > length) {
  //       return createIssue(CODE_STRING_MAX, input, undefined, length, undefined);
  //     }
  //   });
  // }

  _apply(input: unknown, context: IParserContext): Ok<string> | boolean {
    const { _applyChecks } = this;

    if (!isString(input)) {
      return raiseIssue(context, CODE_TYPE, input, undefined, TYPE_STRING, undefined);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, context);
    }
    return true;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export class NumberShape extends Shape<number> {
  constructor(options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  _apply(input: unknown, context: IParserContext): Ok<number> | boolean {
    const { _applyChecks } = this;

    if (!isFinite(input)) {
      return raiseIssue(context, CODE_TYPE, input, undefined, TYPE_NUMBER, undefined);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, context);
    }
    return true;
  }
}

// ---------------------------------------------------------------------------------------------------------------------

export class BooleanShape extends Shape<boolean> {
  constructor(options?: InputConstraintOptionsOrMessage) {
    super(false);
  }

  _apply(input: unknown, context: IParserContext): Ok<boolean> | boolean {
    const { _applyChecks } = this;

    if (typeof input !== 'boolean') {
      return raiseIssue(context, CODE_TYPE, input, undefined, TYPE_BOOLEAN, undefined);
    }
    if (_applyChecks !== null) {
      return _applyChecks(input, context);
    }
    return true;
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

export const enum KeysMode {
  PRESERVED,
  STRIPPED,
  EXACT,
}

export class ObjectShape<P extends Dict<AnyShape>, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  readonly keys;

  protected _options;
  protected _valueShapes: Shape[];

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
  }

  extend<T extends Dict<AnyShape>>(shape: ObjectShape<T, any>): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any> | Dict): ObjectShape<any, I> {
    const shapes = objectAssign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
  }

  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
  }

  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (!keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }
    return new ObjectShape<any, I>(shapes, this.indexerShape, this._options, KeysMode.PRESERVED);
  }

  exact(options?: InputConstraintOptionsOrMessage): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options, KeysMode.EXACT);
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

  _apply(input: unknown, context: IParserContext): Ok<InferObject<P, I, 'output'>> | boolean {
    if (!isObjectLike(input)) {
      return raiseIssue(context, CODE_TYPE, input, undefined, TYPE_OBJECT, undefined);
    }

    const { keys, keysMode, indexerShape, _valueShapes, _applyChecks } = this;

    const keysLength = keys.length;

    let output = input;

    let { issues } = context;
    let issuesOffset = issues.length;
    let valid = true;
    let keyCount = 0;
    let seenBits = 0;
    let unknownKeys: string[] | null = null;

    for (const key in input) {
      const value = input[key];
      const i = keys.indexOf(key as ObjectKey<P>);

      if (i === -1) {
        if (keysMode === KeysMode.PRESERVED) {
          if (indexerShape !== null) {
            const result = indexerShape._apply(value, context);

            if (result === true) {
              continue;
            }
            if (result === false) {
              if (context.earlyReturn) {
                return false;
              }
              valid = false;
              issuesOffset = unshiftKey(context, issuesOffset, key);
              continue;
            }
            if (!valid) {
              continue;
            }
            if (input === output) {
              output = cloneKeys(input);
            }
            output[key] = result.value;
          }
          continue;
        }
        if (keysMode === KeysMode.STRIPPED) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          continue;
        }
        if (keysMode === KeysMode.EXACT) {
          (unknownKeys ||= []).push(key);
          continue;
        }
      }

      seenBits = seenBits | (1 << i);

      ++keyCount;

      const result = _valueShapes[i]._apply(value, context);

      if (result === true) {
        continue;
      }
      if (result === false) {
        if (context.earlyReturn) {
          return false;
        }
        valid = false;
        issuesOffset = unshiftKey(context, issuesOffset, key);
        continue;
      }
      if (!valid) {
        continue;
      }
      if (input === output) {
        output = keysMode === KeysMode.STRIPPED ? cloneKnownKeys(input, keys) : cloneKeys(input);
      }
      output[key] = result.value;
    }

    if (unknownKeys !== null) {
      raiseIssue(context, CODE_UNKNOWN_KEYS, input, MESSAGE_UNKNOWN_KEYS, unknownKeys, undefined);
      if (context.earlyReturn) {
        return false;
      }
    }

    if (keyCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (((seenBits >>> i) & 1) === 1) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = _valueShapes[i]._apply(value, context);

        if (result === true) {
          continue;
        }
        if (result === false) {
          valid = false;
          continue;
        }
        if (input === output) {
          output = cloneKnownKeys(input, keys);
        }
        output[key] = result.value;
      }
    }

    if (input === output) {
      if (_applyChecks !== null) {
        return _applyChecks(output, context);
      }
      return valid;
    }

    if (_applyChecks !== null) {
      if (_applyChecks(output, context)) {
        return ok(output as any);
      }
      return false;
    }
    return valid;
  }
}

function markBit(keyBits: number, index: number): number {
  // const i = index >> 5;
  // keyBits[i] |= 1 << (index - (i << 5));
  return keyBits | (1 << index);
}

function cloneKeys(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}

function cloneKnownKeys(input: Dict, keys: string[]): Dict {
  const keysLength = keys.length;
  const output: Dict = {};

  for (let i = 0; i < keysLength; ++i) {
    const key = keys[i];
    output[key] = input[key];
  }
  return output;
}
