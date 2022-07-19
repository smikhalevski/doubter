import { createIssue, isAsync, isObjectLike, shallowClone } from '../utils';
import { ParserContext } from '../ParserContext';
import { InferType, Type } from './Type';
import { Dict } from '../shared-types';

export type InferObjectType<P extends Dict<Type>> = Squash<UndefinedAsOptional<{ [K in keyof P]: InferType<P[K]> }>>;

export type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

export type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

const enum ObjectKeysMode {
  STRIP,
  PRESERVE,
}

export class ObjectType<P extends Dict<Type>> extends Type<InferObjectType<P>> {
  private _propsMap;
  private _keys;
  private _valueTypes;

  constructor(private _props: P, private _keysMode = ObjectKeysMode.STRIP, private _restType: Type | null = null) {
    super();

    this._propsMap = new Map(Object.entries(_props));
    this._keys = Object.keys(_props);
    this._valueTypes = Object.values(_props);
  }

  isAsync(): boolean {
    return this._restType?.isAsync() || isAsync(this._valueTypes);
  }

  extend<P1 extends Dict<Type>>(type: ObjectType<P1>): ObjectType<Pick<P, Exclude<keyof P, keyof P1>> & P1>;

  extend<P1 extends Dict<Type>>(props: P1): ObjectType<Pick<P, Exclude<keyof P, keyof P1>> & P1>;

  extend(source: ObjectType<any> | Dict<Type>): ObjectType<any> {
    const nextProps = Object.assign({}, this._props, source instanceof ObjectType ? source._props : source);

    return new ObjectType(nextProps, this._keysMode, this._restType);
  }

  pick<A extends Array<keyof P & string>>(...keys: A): ObjectType<Pick<P, A[number]>> {
    const nextProps: Dict<Type> = {};

    for (const key of keys) {
      nextProps[key] = this._props[key];
    }
    return new ObjectType<any>(nextProps, this._keysMode, this._restType);
  }

  omit<A extends Array<keyof P & string>>(...keys: A): ObjectType<Omit<P, A[number]>> {
    const nextProps: Dict<Type> = {};

    this._propsMap.forEach((valueType, key) => {
      if (!keys.includes(key)) {
        nextProps[key] = valueType;
      }
    });
    return new ObjectType<any>(nextProps, this._keysMode, this._restType);
  }

  strip(): ObjectType<P> {
    const type = shallowClone(this);
    type._keysMode = ObjectKeysMode.STRIP;
    return type;
  }

  preserve(): ObjectType<P> {
    const type = shallowClone(this);
    type._keysMode = ObjectKeysMode.PRESERVE;
    return type;
  }

  rest(restType: Type): ObjectType<P> {
    const type = shallowClone(this);
    type._restType = restType;
    return type;
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!isObjectLike(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'object'));
      return input;
    }

    const { _propsMap, _restType } = this;
    const outputKeys = this._keysMode === ObjectKeysMode.STRIP ? this._keys : Object.keys(input);

    if (this.isAsync()) {
      const promises = [];

      for (const key of outputKeys) {
        const value = input[key];
        const valueType = _propsMap.get(key) || _restType;

        promises.push(valueType === null ? value : valueType._parse(value, context.fork(false).enterKey(key)));
      }

      return Promise.all(promises).then(outputValues => {
        if (context.aborted) {
          return input;
        }
        const output: Dict = {};

        for (let i = 0; i < promises.length; ++i) {
          output[outputKeys[i]] = outputValues[i];
        }
        return output;
      });
    }

    const output: Dict = {};

    for (const key of outputKeys) {
      const value = input[key];
      const valueType = _propsMap.get(key) || _restType;

      if (valueType === null) {
        output[key] = value;
        continue;
      }
      context.enterKey(key);
      output[key] = valueType._parse(value, context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }

    return output;
  }
}
