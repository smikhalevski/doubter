import { ApplyResult, Dict, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { CODE_TYPE, CODE_UNKNOWN_KEYS, MESSAGE_OBJECT_TYPE, MESSAGE_UNKNOWN_KEYS, TYPE_OBJECT } from '../constants';
import {
  cloneEnumerableKeys,
  cloneKnownKeys,
  concatIssues,
  createIssueFactory,
  Flags,
  isArray,
  isAsyncShapes,
  isEqual,
  isFlagSet,
  isObjectLike,
  IssueFactory,
  ok,
  pushIssue,
  setFlag,
  setKeyValue,
  unshiftPath,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { EnumShape } from './EnumShape';

export type InferObject<P extends Dict<AnyShape>, R extends AnyShape | null, C extends 'input' | 'output'> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferIndexer<R, C>
>;

export type InferIndexer<R extends AnyShape | null, C extends 'input' | 'output'> = R extends Shape
  ? { [key: string]: R[C] }
  : unknown;

export type ObjectKey<T extends object> = StringifyPropertyKey<keyof T>;

export type StringifyPropertyKey<K extends PropertyKey> = K extends symbol ? never : K extends number ? `${K}` : K;

export type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

export type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export const enum KeysMode {
  PRESERVED,
  STRIPPED,
  EXACT,
}

/**
 * The shape of an object.
 *
 * @template P The mapping from an object key to a corresponding value shape.
 * @template R The shape that constrains values of
 * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
 */
export class ObjectShape<P extends Dict<AnyShape>, R extends AnyShape | null = null> extends Shape<
  InferObject<P, R, 'input'>,
  InferObject<P, R, 'output'>
> {
  /**
   * The array of known object keys.
   */
  readonly keys: readonly ObjectKey<P>[];

  protected _valueShapes: Shape[];
  protected _typeIssueFactory;
  protected _exactIssueFactory: IssueFactory | null = null;

  /**
   * Creates a new {@linkcode ObjectShape} instance.
   *
   * @param shapes The mapping from an object key to a corresponding value shape.
   * @param restShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures). If `null`
   * then values thea fall under the indexer signature are unconstrained.
   * @param _options The type constraint options or an issue message.
   * @param keysMode The mode of unknown keys handling.
   * @template P The mapping from an object key to a corresponding value shape.
   * @template R The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
   */
  constructor(
    /**
     * The mapping from an object key to a corresponding value shape.
     */
    readonly shapes: Readonly<P>,
    /**
     * The shape that constrains values of
     * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
     */
    readonly restShape: R | null = null,
    protected _options?: TypeConstraintOptions | Message,
    /**
     * The mode of unknown keys handling.
     */
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    const keys = Object.keys(shapes);
    const valueShapes = Object.values(shapes);

    super((restShape !== null && restShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys as ObjectKey<P>[];

    this._valueShapes = valueShapes;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_OBJECT_TYPE, _options, TYPE_OBJECT);
  }

  at(key: any): AnyShape | null {
    return this.shapes.hasOwnProperty(key) ? this.shapes[key] : this.restShape;
  }

  /**
   * Merge properties from the other object shape. If a property with the same key already exists on this object shape
   * then it is overwritten. Indexer signature of this shape is preserved intact.
   *
   * @param shape The object shape which properties must be added to this object shape.
   * @returns The new object shape.
   * @template T The type of properties to add.
   */
  extend<T extends Dict<AnyShape>>(shape: ObjectShape<T, any>): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, R>;

  /**
   * Add properties to an object shape. If a property with the same key already exists on this object shape then it is
   * overwritten.
   *
   * @param shapes The properties to add.
   * @returns The new object shape.
   * @template T The shapes of properties to add.
   */
  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, R>;

  extend(shape: ObjectShape<any> | Dict): ObjectShape<any, R> {
    const shapes = Object.assign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.restShape, this._options);
  }

  /**
   * Returns an object shape that only has properties with listed keys.
   *
   * The returned object shape would have no custom checks.
   *
   * @param keys The list of property keys to pick.
   * @returns The new object shape.
   * @template K The tuple of keys to pick.
   */
  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, R> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.indexOf(key) !== -1) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, R>(shapes, this.restShape, this._options);
  }

  /**
   * Returns an object shape that doesn't have the listed keys.
   *
   * The returned object shape would have no custom checks.
   *
   * @param keys The list of property keys to omit.
   * @returns The new object shape.
   * @template K The tuple of keys to omit.
   */
  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, R> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.indexOf(key) === -1) {
        shapes[key] = this._valueShapes[i];
      }
    }
    return new ObjectShape<any, R>(shapes, this.restShape, this._options);
  }

  /**
   * Returns an object shape that allows only known keys and has no index signature.
   *
   * The returned object shape would have no custom checks.
   *
   * @param options The constraint options or an issue message.
   * @returns The new object shape.
   */
  exact(options?: TypeConstraintOptions | Message): ObjectShape<P> {
    const shape = new ObjectShape<P>(this.shapes, null, this._options, KeysMode.EXACT);

    shape._exactIssueFactory = createIssueFactory(CODE_UNKNOWN_KEYS, MESSAGE_UNKNOWN_KEYS, options, undefined);

    return shape;
  }

  /**
   * Returns an object shape that doesn't have indexer signature and all unknown keys are stripped.
   *
   * The returned object shape would have no custom checks.
   *
   * @returns The new object shape.
   */
  strip(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options, KeysMode.STRIPPED);
  }

  /**
   * Returns an object shape that has an indexer signature that doesn't constrain values.
   *
   * The returned object shape would have no custom checks.
   *
   * @returns The new object shape.
   */
  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options);
  }

  /**
   * Returns an object shape that has an indexer signature that is constrained by the given shape.
   *
   * The returned object shape would have no custom checks.
   *
   * @param restShape The shape of the indexer values.
   * @returns The new object shape.
   * @template T The indexer signature shape.
   */
  rest<T extends AnyShape>(restShape: T): ObjectShape<P, T> {
    return new ObjectShape(this.shapes, restShape, this._options);
  }

  /**
   * Returns the enum shape of keys of this object.
   */
  keyof(): EnumShape<ObjectKey<P>> {
    return new EnumShape(this.keys);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferObject<P, R, 'output'>> {
    if (!isObjectLike(input)) {
      return [this._typeIssueFactory(input)];
    }
    if (this.keysMode !== KeysMode.PRESERVED) {
      return this._applyStrictKeysSync(input, options);
    }
    if (this.restShape !== null) {
      return this._applyPreservedRestKeysSync(input, options);
    }
    return this._applyPreservedKeysSync(input, options);
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferObject<P, R, 'output'>>> {
    if (!this.async) {
      return super.applyAsync(input, options);
    }

    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        return [this._typeIssueFactory(input)];
      }

      const { keys, keysMode, restShape, _valueShapes, _applyChecks, _unsafe } = this;

      const keysLength = keys.length;
      const promises: any[] = [];

      let issues: Issue[] | null = null;
      let output = input;

      let seenCount = 0;
      let seenFlags: Flags = 0;

      let unknownKeys: string[] | null = null;

      for (const key in input) {
        const value = input[key];
        const index = keys.indexOf(key as ObjectKey<P>);

        let valueShape: AnyShape | null = restShape;

        if (index !== -1) {
          seenCount++;
          seenFlags = setFlag(seenFlags, index);

          valueShape = _valueShapes[index];
        }

        if (valueShape !== null) {
          promises.push(key, valueShape.applyAsync(value, options));
          continue;
        }

        if (keysMode === KeysMode.EXACT) {
          if (unknownKeys !== null) {
            unknownKeys.push(key);
            continue;
          }

          unknownKeys = [key];

          if (!options.verbose) {
            break;
          }
          continue;
        }

        if (keysMode === KeysMode.STRIPPED && input === output) {
          output = cloneKnownKeys(input, keys);
        }
      }

      if (unknownKeys !== null) {
        const issue = this._exactIssueFactory!(input);
        issue.param = unknownKeys;

        if (!options.verbose) {
          return [issue];
        }
        issues = pushIssue(issues, issue);
      }

      if (seenCount !== keysLength) {
        for (let i = 0; i < keysLength; ++i) {
          if (isFlagSet(seenFlags, i)) {
            continue;
          }

          const key = keys[i];
          const value = input[key];

          promises.push(key, _valueShapes[i].applyAsync(value, options));
        }
      }

      resolve(
        Promise.all(promises).then(entries => {
          const entriesLength = 0;

          for (let i = 0; i < entriesLength; i += 2) {
            const key = entries[i];
            const result: ApplyResult = entries[i + 1];

            if (result === null) {
              continue;
            }
            if (isArray(result)) {
              unshiftPath(result, key);

              if (!options.verbose) {
                return result;
              }
              issues = concatIssues(issues, result);
              continue;
            }
            if ((_unsafe || issues === null) && !isEqual(input[key], result.value)) {
              if (input === output) {
                output = cloneEnumerableKeys(input);
              }
              setKeyValue(output, key, result.value);
            }
          }

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output as InferObject<P, R, 'output'>);
          }
          return issues;
        })
      );
    });
  }

  private _applyPreservedKeysSync(input: Dict, options: ParseOptions): ApplyResult {
    const { keys, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const value = input[key];
      const result = _valueShapes[i].apply(value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, key);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if ((_unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = cloneEnumerableKeys(input);
        }
        setKeyValue(output, key, result.value);
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  private _applyPreservedRestKeysSync(input: Dict, options: ParseOptions): ApplyResult {
    const { keys, restShape, _valueShapes, _applyChecks, _unsafe } = this;

    let issues: Issue[] | null = null;
    let output = input;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);
      const valueShape = index !== -1 ? _valueShapes[index] : restShape!;
      const result = valueShape.apply(value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, key);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if ((_unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = cloneEnumerableKeys(input);
        }
        setKeyValue(output, key, result.value);
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  private _applyStrictKeysSync(input: Dict, options: ParseOptions): ApplyResult {
    const { keys, keysMode, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    let seenCount = 0;
    let seenFlags: Flags = 0;

    let unknownKeys: string[] | null = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);

      if (index !== -1) {
        seenCount++;
        seenFlags = setFlag(seenFlags, index);

        const result = _valueShapes[index].apply(value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftPath(result, key);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if ((_unsafe || issues === null) && !isEqual(value, result.value)) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          setKeyValue(output, key, result.value);
        }
        continue;
      }

      if (keysMode === KeysMode.EXACT) {
        if (unknownKeys !== null) {
          unknownKeys.push(key);
          continue;
        }

        unknownKeys = [key];

        if (!options.verbose) {
          break;
        }
        continue;
      }

      if (input === output && (_unsafe || issues === null)) {
        output = cloneKnownKeys(input, keys);
      }
    }

    if (unknownKeys !== null) {
      const issue = this._exactIssueFactory!(input);
      issue.param = unknownKeys;

      if (!options.verbose) {
        return [issue];
      }
      issues = pushIssue(issues, issue);
    }

    if (seenCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (isFlagSet(seenFlags, i)) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = _valueShapes[i].apply(value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftPath(result, key);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if ((_unsafe || issues === null) && !isEqual(value, result.value)) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          setKeyValue(output, key, result.value);
        }
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }
}
