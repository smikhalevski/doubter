import { AnyType, InferType, Type } from './Type';
import { Awaitable, ConstraintOptions, Dict, ParserOptions, Several } from '../shared-types';
import {
  cloneObject,
  copyObjectEnumerableKeys,
  copyObjectKnownKeys,
  createCatchForKey,
  createValuesExtractor,
  isAsync,
  isEqual,
  isFast,
  isObjectLike,
  parseAsync,
  promiseAll,
  promiseAllSettled,
  raiseIssue,
  raiseIssuesIfDefined,
  raiseIssuesOrCaptureForKey,
  raiseIssuesOrPush,
} from '../utils';

type InferObjectType<P extends Dict<AnyType>, I extends AnyType, V extends 'input' | 'output'> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: InferType<P[K]>[V] }> &
    (I extends Type<never> ? unknown : { [indexer: string]: InferType<I>[V] })
>;

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

const enum ObjectKeysMode {
  EXACT,
  STRIP,
  PRESERVE,
  INDEXER,
}

/**
 * The object type definition.
 *
 * @template P The mapping from an object key to a corresponding type definition.
 * @template I The type definition that constrains the indexer signature.
 */
export class ObjectType<P extends Dict<AnyType>, I extends AnyType> extends Type<
  InferObjectType<P, I, 'input'>,
  InferObjectType<P, I, 'output'>
> {
  protected keys;
  protected valueTypes;
  protected keysMode;
  protected propEntries;
  protected exactOptions?: ConstraintOptions;

  /**
   * Creates a new {@link ObjectType} instance.
   *
   * @param props The mapping from an object key to a corresponding type definition.
   * @param indexerType The type definition that constrains the indexer signature. If `null` then values thea fall
   * under the indexer signature are unconstrained.
   * @param options The constraint options.
   */
  constructor(protected props: P, protected indexerType: I | null, options?: ConstraintOptions) {
    const valueTypes = Object.values(props);

    super(indexerType?.async || isAsync(valueTypes), options);

    this.keys = Object.keys(props);
    this.valueTypes = valueTypes;
    this.propEntries = Object.entries(props);
    this.keysMode = indexerType === null ? ObjectKeysMode.PRESERVE : ObjectKeysMode.INDEXER;
  }

  at(key: unknown): AnyType | null {
    if (typeof key !== 'string') {
      return null;
    }
    if (this.keys.includes(key)) {
      return this.props[key];
    }
    return this.indexerType;
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
    const nextProps = Object.assign({}, this.props, arg instanceof ObjectType ? arg.props : arg);

    const type = new ObjectType<any, I>(nextProps, this.indexerType);
    type.keysMode = this.keysMode;
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
      nextProps[key] = this.props[key];
    }
    const type = new ObjectType<any, I>(nextProps, this.indexerType);
    type.keysMode = this.keysMode;
    return type;
  }

  /**
   * Returns an object type that doesn't have the listed keys.
   *
   * @param keys2 The list of property keys to omit.
   * @returns The modified object type.
   *
   * @template K The tuple of keys to omit.
   */
  omit<K extends Several<keyof P & string>>(...keys2: K): ObjectType<Omit<P, K[number]>, I> {
    const { keys } = this;
    const nextProps: Dict<AnyType> = {};

    for (let i = 0; i < keys.length; ++i) {
      if (!keys2.includes(keys[i])) {
        nextProps[keys[i]] = this.valueTypes[i];
      }
    }

    const type = new ObjectType<any, I>(nextProps, this.indexerType);
    type.keysMode = this.keysMode;
    return type;
  }

  /**
   * Returns an object type that allows only known keys and has no index signature.
   *
   * @returns The modified object type.
   */
  exact(options?: ConstraintOptions): ObjectType<P, Type<never>> {
    const type = cloneObject<ObjectType<any, any>>(this);
    type.keysMode = ObjectKeysMode.EXACT;
    type.exactOptions = options;
    type.indexerType = null;
    return type;
  }

  /**
   * Returns an object type that doesn't have indexer signature and all unknown keys are stripped.
   *
   * @returns The modified object type.
   */
  strip(): ObjectType<P, Type<never>> {
    const type = cloneObject<ObjectType<any, any>>(this);
    type.keysMode = ObjectKeysMode.STRIP;
    type.indexerType = null;
    return type;
  }

  /**
   * Returns an object type that has an indexer signature that doesn't constrain values.
   *
   * @returns The modified object type.
   */
  preserve(): ObjectType<P, Type<any>> {
    const type = cloneObject<ObjectType<any, any>>(this);
    type.keysMode = ObjectKeysMode.PRESERVE;
    type.indexerType = null;
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
    const type = cloneObject<ObjectType<any, any>>(this);
    type.keysMode = ObjectKeysMode.INDEXER;
    type.indexerType = indexType;
    return type;
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<InferObjectType<P, I, 'output'>> {
    if (!isObjectLike(input)) {
      raiseIssue(input, 'type', 'object', this.options, 'Must be an object');
    }

    const { propEntries, keysMode, keys, indexerType } = this;

    let output = input;
    let issues;

    if (keysMode === ObjectKeysMode.EXACT || keysMode === ObjectKeysMode.STRIP) {
      for (const key in input) {
        if (keys.includes(key)) {
          continue;
        }

        if (keysMode === ObjectKeysMode.EXACT) {
          issues = raiseIssuesOrPush(
            issues,
            options,
            input,
            'unknownKeys',
            key,
            this.exactOptions,
            'Must have known keys but found ' + key
          );
        }
        if (output === input) {
          output = copyObjectKnownKeys(input, keys);
        }
      }
    }

    if (this.async) {
      const promises = [];

      let objectKeys = keys;

      const handleResults = (results: any): any => {
        for (let i = 0; i < objectKeys.length; ++i) {
          const key = objectKeys[i];
          const outputValue = results[i];

          if (isEqual(outputValue, input[key])) {
            continue;
          }
          if (output === input) {
            output = copyObjectEnumerableKeys(input);
          }
          output[key] = outputValue;
        }
        return output;
      };

      for (const [key, type] of propEntries) {
        promises.push(parseAsync(type, input[key], options).catch(createCatchForKey(key)));
      }

      if (keysMode === ObjectKeysMode.INDEXER) {
        for (const key in input) {
          if (keys.includes(key)) {
            continue;
          }
          if (objectKeys === keys) {
            objectKeys = keys.slice(0);
          }
          objectKeys.push(key);
          promises.push(parseAsync(indexerType!, input[key], options).catch(createCatchForKey(key)));
        }
      }

      if (isFast(options)) {
        return promiseAll(promises).then(handleResults);
      }
      return promiseAllSettled(promises).then(createValuesExtractor(issues)).then(handleResults);
    }

    for (const [key, type] of propEntries) {
      const value = input[key];

      let outputValue;
      try {
        outputValue = type.parse(value, options);
      } catch (error) {
        issues = raiseIssuesOrCaptureForKey(error, issues, options, key);
      }
      if (isEqual(outputValue, value) || issues !== undefined) {
        continue;
      }
      if (output === input) {
        output = copyObjectEnumerableKeys(input);
      }
      output[key] = outputValue;
    }

    if (keysMode === ObjectKeysMode.INDEXER) {
      for (const key in input) {
        if (keys.includes(key)) {
          continue;
        }

        const value = input[key];

        let outputValue;
        try {
          outputValue = indexerType!.parse(value, options);
        } catch (error) {
          issues = raiseIssuesOrCaptureForKey(error, issues, options, key);
        }
        if (isEqual(outputValue, value) || issues !== undefined) {
          continue;
        }
        if (output === input) {
          output = copyObjectEnumerableKeys(input);
        }
        output[key] = outputValue;
      }
    }

    raiseIssuesIfDefined(issues);

    return output as any;
  }
}
