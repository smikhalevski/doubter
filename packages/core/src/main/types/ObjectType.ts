import { isAsync, isObjectLike } from '../utils';
import { ParserContext } from '../ParserContext';
import { InferType, Type } from './Type';
import { Dict } from '../shared-types';

export function object<P extends Dict<Type>>(props: P): ObjectType<P> {
  return new ObjectType(props, ObjectKeysMode.PRESERVE, null);
}

export const enum ObjectKeysMode {
  EXACT,
  STRIP,
  PRESERVE,
}

export type InferObjectType<P extends Dict<Type>> = Squash<UndefinedAsOptional<{ [K in keyof P]: InferType<P[K]> }>>;

export type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

export type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export class ObjectType<P extends Dict<Type>> extends Type<InferObjectType<P>> {
  private _entries;
  private _keys;

  constructor(private _props: P, private _keyMode: ObjectKeysMode, private _unknownKeyType: Type | null) {
    super();

    this._entries = Object.entries(_props);
    this._keys = new Set(Object.keys(_props));
  }

  isAsync(): boolean {
    return isAsync(Object.values(this._props));
  }

  extend<P1 extends Dict<Type>>(type: ObjectType<P1>): ObjectType<Pick<P, Exclude<keyof P, keyof P1>> & P1>;

  extend<P1 extends Dict<Type>>(props: P1): ObjectType<Pick<P, Exclude<keyof P, keyof P1>> & P1>;

  extend(source: ObjectType<any> | Dict<Type>): ObjectType<any> {
    const nextProps = Object.assign({}, this._props, source instanceof ObjectType ? source._props : source);

    return new ObjectType(nextProps, this._keyMode, this._unknownKeyType);
  }

  pick<A extends Array<keyof P & string>>(...keys: A): ObjectType<Pick<P, A[number]>> {
    const nextProps: Dict<Type> = {};

    for (const key of keys) {
      nextProps[key] = this._props[key];
    }
    return new ObjectType<any>(nextProps, this._keyMode, this._unknownKeyType);
  }

  omit<A extends Array<keyof P & string>>(...keys: A): ObjectType<Omit<P, A[number]>> {
    const nextProps: Dict<Type> = {};

    for (const [key, type] of this._entries) {
      if (!keys.includes(key)) {
        nextProps[key] = type;
      }
    }
    return new ObjectType<any>(nextProps, this._keyMode, this._unknownKeyType);
  }

  // partial(): ObjectType<{ [K in keyof P]: OptionalType<InferType<P[K]>, InferFlow<P[K]>> }> {
  //   const nextProps: Dict<Type> = {};
  //
  //   for (const [key, type] of this._entries) {
  //     nextProps[key] = new OptionalType(type);
  //   }
  //   return new ObjectType<any>(nextProps, this._keyMode, this._unknownKeyType);
  // }

  exact(): ObjectType<P> {
    return new ObjectType(this._props, ObjectKeysMode.EXACT, this._unknownKeyType);
  }

  strip(): ObjectType<P> {
    return new ObjectType(this._props, ObjectKeysMode.STRIP, this._unknownKeyType);
  }

  preserve(): ObjectType<P> {
    return new ObjectType(this._props, ObjectKeysMode.PRESERVE, this._unknownKeyType);
  }

  rest(type: Type): ObjectType<P> {
    return new ObjectType(this._props, this._keyMode, type);
  }

  _parse(input: any, context: ParserContext): any {
    if (!isObjectLike(input) || Object.getPrototypeOf(input) !== Object.prototype) {
      // context.raiseIssue('NOT_PLAIN_OBJECT', 'Must be a plain object');
      return input;
    }

    let copied = false;

    const { _entries, _keys } = this;

    switch (this._keyMode) {
      case ObjectKeysMode.EXACT:
        for (const key of Object.keys(input)) {
          if (!_keys.has(key)) {
            // context.raiseIssue('UNKNOWN_KEY', 'Must have known keys only but "' + key + '" was found');
            //
            // if (aborted) {
            //   return input;
            // }
          }
        }
        break;

      case ObjectKeysMode.STRIP:
        const nextValue = stripUnknownKeys(input, _keys);
        copied = input !== nextValue;
        input = nextValue;
        break;
    }

    if (this.isAsync()) {
      let promise = Promise.resolve(() => input);

      for (const [key, type] of _entries) {
        promise = promise
          .then(() => {
            context.enterKey(key);

            return type._parse(input[key], context);
          })
          .then(value => {
            if (!Object.is(value, value[key]) && context.aborted) {
              if (!copied) {
                copied = true;
                value = Object.assign({}, value);
              }
              value[key] = value;
            }

            context.exitKey();
            return value;
          });
      }

      return promise;
    }

    for (const [key, type] of _entries) {
      context.enterKey(key);

      const result = type._parse(input[key], context);

      if (!Object.is(result, input[key]) && context.aborted) {
        if (!copied) {
          copied = true;
          input = Object.assign({}, input);
        }
        input[key] = result;
      }

      context.exitKey();
    }

    return input;
  }
}

function stripUnknownKeys(value: Dict, knownKeys: Set<string>): Dict {
  const keys = Object.keys(value);

  for (const key of keys) {
    if (knownKeys.has(key)) {
      continue;
    }
    const nextValue: Dict = {};

    for (const key of keys) {
      if (knownKeys.has(key)) {
        nextValue[key] = value[key];
      }
    }
    return nextValue;
  }
  return value;
}
