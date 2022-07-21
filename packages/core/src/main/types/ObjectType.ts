import { createIssue, isAsync, isObjectLike, shallowClone } from '../utils';
import { ParserContext } from '../ParserContext';
import { AnyType, InferType, Type } from './Type';
import { Dict, Several } from '../shared-types';

type InferObjectType<P extends Dict<AnyType>, I extends AnyType> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: InferType<P[K]> }> & InferIndexerType<I>
>;

type InferIndexerType<I extends AnyType> = I extends Type<never> ? unknown : { [indexer: string]: InferType<I> };

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

const enum ObjectKeysMode {
  STRIP,
  PRESERVE,
}

/**
 * The object type definition.
 *
 * @template P The mapping from an object key to a corresponding type definition.
 * @template I The type definition that constrains the indexer signature.
 */
export class ObjectType<P extends Dict<AnyType>, I extends AnyType> extends Type<InferObjectType<P, I>> {
  private _propsMap;
  private _keys;
  private _valueTypes;
  private _keysMode;

  /**
   * Creates a new {@link ObjectType} instance.
   *
   * @param _props The mapping from an object key to a corresponding type definition.
   * @param _indexerType The type definition that constrains the indexer signature. If `null` then values thea fall
   * under the indexer signature are unconstrained.
   */
  constructor(private _props: P, private _indexerType: I | null) {
    super();

    this._propsMap = new Map(Object.entries(_props));
    this._keys = Object.keys(_props);
    this._valueTypes = Object.values(_props);
    this._keysMode = _indexerType === null ? ObjectKeysMode.STRIP : ObjectKeysMode.PRESERVE;
  }

  /**
   * Merge properties from the other object type. If a property with the same key already exists on this object type
   * then it is overwritten. Indexer signature of this type is preserved intact.
   *
   * @param type The object type which properties must be added to this object type.
   * @returns The modified object type.
   *
   * @template P1 The type of properties to add.
   */
  extend<P1 extends Dict<AnyType>>(
    type: ObjectType<P1, AnyType>
  ): ObjectType<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  /**
   * Add properties to an object type. If a property with the same key already exists on this object type then it is
   * overwritten.
   *
   * @param props The properties to add.
   * @returns The modified object type.
   *
   * @template P1 The type of properties to add.
   */
  extend<P1 extends Dict<AnyType>>(props: P1): ObjectType<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend(arg: ObjectType<any, AnyType> | Dict<AnyType>): ObjectType<any, I> {
    const nextProps = Object.assign({}, this._props, arg instanceof ObjectType ? arg._props : arg);

    const type = new ObjectType<any, I>(nextProps, this._indexerType);
    type._keysMode = this._keysMode;
    return type;
  }

  /**
   * Returns an object type that only has properties with listed keys.
   *
   * @param keys The list of property keys to pick.
   * @returns The modified object type.
   *
   * @template K The tuple of keys to pick.
   */
  pick<K extends Several<keyof P & string>>(...keys: K): ObjectType<Pick<P, K[number]>, I> {
    const nextProps: Dict<AnyType> = {};

    for (const key of keys) {
      nextProps[key] = this._props[key];
    }
    const type = new ObjectType<any, I>(nextProps, this._indexerType);
    type._keysMode = this._keysMode;
    return type;
  }

  /**
   * Returns an object type that doesn't have the listed keys.
   *
   * @param keys The list of property keys to omit.
   * @returns The modified object type.
   *
   * @template K The tuple of keys to omit.
   */
  omit<K extends Several<keyof P & string>>(...keys: K): ObjectType<Omit<P, K[number]>, I> {
    const { _keys } = this;
    const nextProps: Dict<AnyType> = {};

    for (let i = 0; i < this._keys.length; ++i) {
      if (!keys.includes(_keys[i])) {
        nextProps[_keys[i]] = this._valueTypes[i];
      }
    }

    const type = new ObjectType<any, I>(nextProps, this._indexerType);
    type._keysMode = this._keysMode;
    return type;
  }

  /**
   * Returns an object type that doesn't have indexer signature and all unknown keys are stripped.
   *
   * @returns The modified object type.
   */
  strip(): ObjectType<P, Type<never>> {
    const type = shallowClone<ObjectType<any, any>>(this);
    type._keysMode = ObjectKeysMode.STRIP;
    type._indexerType = null;
    return type;
  }

  /**
   * Returns an object type that has an indexer signature that doesn't constrain values.
   *
   * @returns The modified object type.
   */
  preserve(): ObjectType<P, Type<any>> {
    const type = shallowClone<ObjectType<any, any>>(this);
    type._keysMode = ObjectKeysMode.PRESERVE;
    type._indexerType = null;
    return type;
  }

  /**
   * Returns an object type that has an indexer signature that is constrained by the given type.
   *
   * @param indexType The type of the indexer values.
   * @returns The modified object type.
   *
   * @template I1 The indexer signature type.
   */
  index<I1 extends AnyType>(indexType: I1): ObjectType<P, I1> {
    const type = shallowClone<ObjectType<any, any>>(this);
    type._keysMode = ObjectKeysMode.PRESERVE;
    type._indexerType = indexType;
    return type;
  }

  isAsync(): boolean {
    return this._indexerType?.isAsync() || isAsync(this._valueTypes);
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!isObjectLike(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'object'));
      return input;
    }

    const { _propsMap, _indexerType } = this;
    const outputKeys = this._keysMode === ObjectKeysMode.STRIP ? this._keys : Object.keys(input);

    if (this.isAsync()) {
      const promises = [];

      for (const key of outputKeys) {
        const value = input[key];
        const valueType = _propsMap.get(key) || _indexerType;

        promises.push(valueType === null ? value : valueType._parse(value, context.fork().enterKey(key)));
      }

      return Promise.all(promises).then(outputValues => {
        if (context.aborted) {
          return input;
        }
        const output: Dict = {};
        const valuesLength = outputValues.length;

        for (let i = 0; i < valuesLength; ++i) {
          output[outputKeys[i]] = outputValues[i];
        }
        return output;
      });
    }

    const output: Dict = {};

    for (const key of outputKeys) {
      const value = input[key];
      const valueType = _propsMap.get(key) || _indexerType;

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
