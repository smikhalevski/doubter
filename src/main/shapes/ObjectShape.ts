import { ConstraintOptions, Issue, Message, ParseOptions } from '../shared-types';
import { CODE_TYPE, CODE_UNKNOWN_KEYS, MESSAGE_OBJECT_TYPE, MESSAGE_UNKNOWN_KEYS, TYPE_OBJECT } from '../constants';
import {
  Bits,
  cloneObject,
  cloneObjectEnumerableKeys,
  cloneObjectKnownKeys,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  Dict,
  enableBitAt,
  isArray,
  isAsyncShapes,
  isBitEnabledAt,
  isEqual,
  isObjectLike,
  isPlainObject,
  ok,
  ReadonlyDict,
  setKeyValue,
  toDeepPartialShape,
  unshiftPath,
} from '../utils';
import {
  AnyShape,
  ApplyResult,
  DeepPartialProtocol,
  ExcludeShape,
  OptionalDeepPartialShape,
  ReplaceShape,
  Shape,
  ValueType,
} from './Shape';
import { EnumShape } from './EnumShape';

// prettier-ignore
export type InferObject<P extends ReadonlyDict<AnyShape>, R extends AnyShape | null, C extends 'input' | 'output'> =
  Squash<UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferIndexer<R, C>>;

// prettier-ignore
export type InferIndexer<R extends AnyShape | null, C extends 'input' | 'output'> =
  R extends Shape ? { [key: string]: R[C] } : unknown;

export type StringKeyof<T extends object> = Extract<keyof T, string>;

export type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

export type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type Optional<P extends ReadonlyDict<AnyShape>> = { [K in keyof P]: ReplaceShape<P[K], undefined, undefined> };

export type Required<P extends ReadonlyDict<AnyShape>> = { [K in keyof P]: ExcludeShape<P[K], undefined> };

export type KeysMode = 'preserved' | 'stripped' | 'exact';

export type DeepPartialObjectShape<P extends ReadonlyDict<AnyShape>, R extends AnyShape | null> = ObjectShape<
  { [K in keyof P]: OptionalDeepPartialShape<P[K]> },
  R extends AnyShape ? OptionalDeepPartialShape<R> : null
>;

/**
 * The shape of an object.
 *
 * @template P The mapping from an object key to a corresponding value shape.
 * @template R The shape that constrains values of
 * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
 */
export class ObjectShape<P extends ReadonlyDict<AnyShape>, R extends AnyShape | null>
  extends Shape<InferObject<P, R, 'input'>, InferObject<P, R, 'output'>>
  implements DeepPartialProtocol<DeepPartialObjectShape<P, R>>
{
  /**
   * The array of known object keys.
   */
  readonly keys: readonly StringKeyof<P>[];

  /**
   * The mode of unknown keys handling.
   */
  readonly keysMode: KeysMode;

  protected _options;
  protected _valueShapes: Shape[];
  protected _typePredicate = isObjectLike;
  protected _typeIssueFactory;
  protected _exactIssueFactory?: (input: unknown, options: Readonly<ParseOptions>, param: unknown) => Issue[];

  /**
   * Creates a new {@linkcode ObjectShape} instance.
   *
   * @param shapes The mapping from an object key to a corresponding value shape.
   * @param restShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures). If `null`
   * then values thea fall under the index signature are unconstrained.
   * @param options The type constraint options or an issue message.
   * @param keysMode The mode of unknown keys handling.
   * @template P The mapping from an object key to a corresponding value shape.
   * @template R The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
   */
  constructor(
    /**
     * The mapping from an object key to a corresponding value shape.
     */
    readonly shapes: P,
    /**
     * The shape that constrains values of
     * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
     */
    readonly restShape: R,
    options?: ConstraintOptions | Message,
    keysMode: KeysMode = 'preserved'
  ) {
    super();

    this.keys = Object.keys(shapes) as StringKeyof<P>[];
    this.keysMode = keysMode;

    this._options = options;
    this._valueShapes = Object.values(shapes);
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, MESSAGE_OBJECT_TYPE, options, TYPE_OBJECT);
  }

  at(key: any): AnyShape | null {
    return this.shapes.hasOwnProperty(key) ? this.shapes[key] : this.restShape;
  }

  /**
   * Merge properties from the other object shape.
   *
   * If a property with the same key already exists on this object shape then it is overwritten. The index signature of
   * this shape and its {@linkcode keysMode} is preserved intact.
   *
   * The returned object shape would have no checks.
   *
   * @param shape The object shape which properties must be added to this object shape.
   * @returns The new object shape.
   * @template T Properties to add.
   */
  extend<T extends ReadonlyDict<AnyShape>>(
    shape: ObjectShape<T, any>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, R>;

  /**
   * Add properties to an object shape.
   *
   * If a property with the same key already exists on this object shape then it is overwritten. The index signature of
   * this shape and its {@linkcode keysMode} is preserved intact.
   *
   * The returned object shape would have no checks.
   *
   * @param shapes The properties to add.
   * @returns The new object shape.
   * @template T The shapes of properties to add.
   */
  extend<T extends ReadonlyDict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, R>;

  extend(shape: ObjectShape<any, any> | ReadonlyDict) {
    const shapes = Object.assign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return copyUnsafeChecks(this, new ObjectShape(shapes, this.restShape, this._options, this.keysMode));
  }

  /**
   * Returns an object shape that only has properties with listed keys.
   *
   * The returned object shape would have no checks.
   *
   * @param keys The list of property keys to pick.
   * @returns The new object shape.
   * @template K The tuple of keys to pick.
   */
  pick<K extends StringKeyof<P>[]>(keys: K): ObjectShape<Pick<P, K[number]>, R> {
    const shapes: Dict<AnyShape> = {};

    for (const key in this.shapes) {
      if (keys.includes(key)) {
        shapes[key] = this.shapes[key];
      }
    }
    return copyUnsafeChecks(this, new ObjectShape<any, any>(shapes, this.restShape, this._options, this.keysMode));
  }

  /**
   * Returns an object shape that doesn't have the listed keys.
   *
   * The returned object shape would have no checks.
   *
   * @param keys The list of property keys to omit.
   * @returns The new object shape.
   * @template K The tuple of keys to omit.
   */
  omit<K extends StringKeyof<P>[]>(keys: K): ObjectShape<Omit<P, K[number]>, R> {
    const shapes: Dict<AnyShape> = {};

    for (const key in this.shapes) {
      if (!keys.includes(key)) {
        shapes[key] = this.shapes[key];
      }
    }
    return copyUnsafeChecks(this, new ObjectShape<any, any>(shapes, this.restShape, this._options, this.keysMode));
  }

  /**
   * Returns an object shape with all properties marked as optional.
   *
   * The returned object shape would have no checks.
   *
   * @returns The new object shape.
   */
  partial(): ObjectShape<Optional<P>, R>;

  /**
   * Returns an object shape with keys marked as optional.
   *
   * The returned object shape would have no checks.
   *
   * @param keys The list of property keys to make optional.
   * @returns The new object shape.
   * @template K The list of string keys.
   */
  partial<K extends StringKeyof<P>[]>(keys: K): ObjectShape<Omit<P, K[number]> & Optional<Pick<P, K[number]>>, R>;

  partial(keys?: string[]) {
    const shapes: Dict<AnyShape> = {};

    for (const key in this.shapes) {
      shapes[key] = keys === undefined || keys.includes(key) ? this.shapes[key].optional() : this.shapes[key];
    }
    return copyUnsafeChecks(this, new ObjectShape<any, any>(shapes, this.restShape, this._options, this.keysMode));
  }

  deepPartial(): DeepPartialObjectShape<P, R> {
    const shapes: Dict<AnyShape> = {};

    for (const key in this.shapes) {
      shapes[key] = toDeepPartialShape(this.shapes[key]).optional();
    }

    const restShape = this.restShape !== null ? toDeepPartialShape(this.restShape).optional() : null;

    return copyUnsafeChecks(this, new ObjectShape<any, any>(shapes, restShape, this._options, this.keysMode));
  }

  /**
   * Returns an object shape with all properties marked as required.
   *
   * The returned object shape would have no checks.
   *
   * @returns The new object shape.
   */
  required(): ObjectShape<Required<P>, R>;

  /**
   * Returns an object shape with keys marked as required.
   *
   * The returned object shape would have no checks.
   *
   * @param keys The list of property keys to make required.
   * @returns The new object shape.
   * @template K The list of string keys.
   */
  required<K extends StringKeyof<P>[]>(keys: K): ObjectShape<Omit<P, K[number]> & Required<Pick<P, K[number]>>, R>;

  required(keys?: string[]) {
    const shapes: Dict<AnyShape> = {};

    for (const key in this.shapes) {
      shapes[key] = keys === undefined || keys.includes(key) ? this.shapes[key].nonOptional() : this.shapes[key];
    }
    return copyUnsafeChecks(this, new ObjectShape<any, any>(shapes, this.restShape, this._options, this.keysMode));
  }

  /**
   * Returns an object shape that allows only known keys and has no index signature.
   *
   * The returned object shape would have no checks.
   *
   * @param options The constraint options or an issue message.
   * @returns The new object shape.
   */
  exact(options?: ConstraintOptions | Message): ObjectShape<P, null> {
    const shape = new ObjectShape(this.shapes, null, this._options, 'exact');

    shape._exactIssueFactory = createIssueFactory(CODE_UNKNOWN_KEYS, MESSAGE_UNKNOWN_KEYS, options);

    return copyUnsafeChecks(this, shape);
  }

  /**
   * Returns an object shape that doesn't have an index signature and all unknown keys are stripped.
   *
   * The returned object shape would have no checks.
   *
   * @returns The new object shape.
   */
  strip(): ObjectShape<P, null> {
    return copyUnsafeChecks(this, new ObjectShape(this.shapes, null, this._options, 'stripped'));
  }

  /**
   * Returns an object shape that has an index signature that doesn't constrain values.
   *
   * The returned object shape would have no checks.
   *
   * @returns The new object shape.
   */
  preserve(): ObjectShape<P, null> {
    return copyUnsafeChecks(this, new ObjectShape(this.shapes, null, this._options));
  }

  /**
   * Returns an object shape that has an index signature that is constrained by the given shape.
   *
   * The returned object shape would have no checks.
   *
   * @param restShape The shape that validates values at unknown keys.
   * @returns The new object shape.
   * @template T The index signature shape.
   */
  rest<T extends AnyShape>(restShape: T): ObjectShape<P, T> {
    return copyUnsafeChecks(this, new ObjectShape(this.shapes, restShape, this._options));
  }

  /**
   * Returns the enum shape of keys of this object.
   */
  keyof(): EnumShape<StringKeyof<P>> {
    return new EnumShape(this.keys);
  }

  /**
   * Constrains an object to be an `Object` instance or to have a `null` prototype.
   */
  plain(): this {
    const shape = cloneObject(this);
    shape._typePredicate = isPlainObject;
    return shape;
  }

  protected _requiresAsync(): boolean {
    return (this.restShape !== null && this.restShape.async) || isAsyncShapes(Object.values(this.shapes));
  }

  protected _getInputTypes(): ValueType[] {
    return [TYPE_OBJECT];
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<InferObject<P, R, 'output'>> {
    if (!this._typePredicate(input)) {
      return this._typeIssueFactory(input, options);
    }
    if (this.keysMode === 'preserved' && this.restShape === null) {
      return this._applyRestUnchecked(input, options);
    } else {
      return this._applyRestChecked(input, options);
    }
  }

  protected _applyAsync(input: any, options: ParseOptions): Promise<ApplyResult<InferObject<P, R, 'output'>>> {
    return new Promise(resolve => {
      if (!this._typePredicate(input)) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keys, keysMode, restShape, _valueShapes, _applyChecks, _unsafe } = this;

      const keysLength = keys.length;
      const promises: any[] = [];

      let issues: Issue[] | null = null;
      let output = input;

      let seenCount = 0;
      let seenBits: Bits = 0;

      let unknownKeys: string[] | null = null;

      for (const key in input) {
        const value = input[key];
        const index = keys.indexOf(key as StringKeyof<P>);

        let valueShape: AnyShape | null = restShape;

        if (index !== -1) {
          seenCount++;
          seenBits = enableBitAt(seenBits, index);

          valueShape = _valueShapes[index];
        }

        if (valueShape !== null) {
          promises.push(key, valueShape['_applyAsync'](value, options));
          continue;
        }

        if (keysMode === 'exact') {
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

        if (input === output && keysMode === 'stripped') {
          output = cloneObjectKnownKeys(input, keys);
        }
      }

      if (unknownKeys !== null) {
        const issue = this._exactIssueFactory!(input, options, unknownKeys);

        if (!options.verbose) {
          resolve(issue);
          return;
        }
        issues = concatIssues(issues, issue);
      }

      if (seenCount !== keysLength) {
        for (let i = 0; i < keysLength; ++i) {
          if (isBitEnabledAt(seenBits, i)) {
            continue;
          }

          const key = keys[i];
          const value = input[key];

          promises.push(key, _valueShapes[i]['_applyAsync'](value, options));
        }
      }

      resolve(
        Promise.all(promises).then(entries => {
          const entriesLength = entries.length;

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
                output = cloneObjectEnumerableKeys(input);
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

  /**
   * Unknown keys are preserved as is and aren't checked.
   */
  private _applyRestUnchecked(input: ReadonlyDict, options: ParseOptions): ApplyResult {
    const { keys, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues = null;
    let output = input;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const value = input[key];
      const result = _valueShapes[i]['_apply'](value, options);

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
          output = cloneObjectEnumerableKeys(input);
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

  /**
   * Unknown keys are either parsed with a {@linkcode restShape}, stripped, or cause an issue.
   */
  private _applyRestChecked(input: ReadonlyDict, options: ParseOptions): ApplyResult {
    const { keys, keysMode, restShape, _valueShapes, _applyChecks, _unsafe } = this;

    const keysLength = keys.length;

    let issues = null;
    let output = input;

    let seenCount = 0;
    let seenBits: Bits = 0;

    let unknownKeys = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as StringKeyof<P>);

      let valueShape: AnyShape | null = restShape;

      // The key is known
      if (index !== -1) {
        seenCount++;
        seenBits = enableBitAt(seenBits, index);

        valueShape = _valueShapes[index];
      }

      // The key is known or indexed
      if (valueShape !== null) {
        const result = valueShape['_apply'](value, options);

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
            output = restShape === null ? cloneObjectKnownKeys(input, keys) : cloneObjectEnumerableKeys(input);
          }
          setKeyValue(output, key, result.value);
        }
        continue;
      }

      // Unknown keys raise an issue
      if (keysMode === 'exact') {
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

      // Unknown keys are stripped
      if (input === output && (_unsafe || issues === null)) {
        output = cloneObjectKnownKeys(input, keys);
      }
    }

    // Raise unknown keys issue
    if (unknownKeys !== null) {
      const issue = this._exactIssueFactory!(input, options, unknownKeys);

      if (!options.verbose) {
        return issue;
      }
      issues = concatIssues(issues, issue);
    }

    // Parse absent known keys
    if (seenCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (isBitEnabledAt(seenBits, i)) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = _valueShapes[i]['_apply'](value, options);

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
            output = cloneObjectEnumerableKeys(input);
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
