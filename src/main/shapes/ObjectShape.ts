import { CODE_TYPE, CODE_UNKNOWN_KEYS, MESSAGE_OBJECT_TYPE, MESSAGE_UNKNOWN_KEYS, TYPE_OBJECT } from '../constants';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  Bitmask,
  cloneDict,
  cloneDictKeys,
  cloneInstance,
  concatIssues,
  copyUnsafeChecks,
  createIssueFactory,
  Dict,
  getBit,
  isArray,
  isAsyncShape,
  isObjectLike,
  isPlainObject,
  ok,
  ReadonlyDict,
  setObjectProperty,
  toDeepPartialShape,
  toggleBit,
  unshiftIssuesPath,
} from '../utils';
import { EnumShape } from './EnumShape';
import {
  AllowLiteralShape,
  AnyShape,
  DeepPartialProtocol,
  DenyLiteralShape,
  OptionalDeepPartialShape,
  Result,
  Shape,
  ValueType,
} from './Shape';

// prettier-ignore
export type InferObject<P extends ReadonlyDict<AnyShape>, R extends AnyShape | null, C extends 'input' | 'output'> =
  Prettify<UndefinedAsOptionalProps<{ [K in keyof P]: P[K][C] }> & InferIndexer<R, C>>;

// prettier-ignore
export type InferIndexer<R extends AnyShape | null, C extends 'input' | 'output'> =
  R extends Shape ? { [key: string]: R[C] } : unknown;

export type StringKeyof<T extends object> = Extract<keyof T, string>;

export type Prettify<T> = { [K in keyof T]: T[K] } & {};

export type UndefinedAsOptionalProps<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type OptionalProps<P extends ReadonlyDict<AnyShape>> = { [K in keyof P]: AllowLiteralShape<P[K], undefined> };

export type RequiredProps<P extends ReadonlyDict<AnyShape>> = { [K in keyof P]: DenyLiteralShape<P[K], undefined> };

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
 * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures), or `null`
 * if there's no index signature.
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
   * The mode of keys handling.
   */
  readonly keysMode: KeysMode;

  protected _options;
  protected _valueShapes: Shape[];
  protected _typePredicate = isObjectLike;
  protected _typeIssueFactory;
  protected _exactIssueFactory?: (input: unknown, options: Readonly<ApplyOptions>, param: unknown) => Issue[];

  /**
   * Creates a new {@linkcode ObjectShape} instance.
   *
   * @param shapes The mapping from an object key to a corresponding value shape.
   * @param restShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures). If `null`
   * then values thea fall under the index signature are unconstrained.
   * @param options The type constraint options or an issue message.
   * @param keysMode The mode of keys handling.
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

  /**
   * `true` if the object must have `Object` constructor or `null` prototype; `false` otherwise.
   */
  get isPlain(): boolean {
    return this._typePredicate === isPlainObject;
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
   * @param keys The array of property keys to pick.
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
   * @param keys The array of property keys to omit.
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
   * @returns The new object shape.
   */
  partial(): ObjectShape<OptionalProps<P>, R>;

  /**
   * Returns an object shape with keys marked as optional.
   *
   * @param keys The array of property keys to make optional.
   * @returns The new object shape.
   * @template K The array of string keys.
   */
  partial<K extends StringKeyof<P>[]>(keys: K): ObjectShape<Omit<P, K[number]> & OptionalProps<Pick<P, K[number]>>, R>;

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
   * @returns The new object shape.
   */
  required(): ObjectShape<RequiredProps<P>, R>;

  /**
   * Returns an object shape with keys marked as required.
   *
   * @param keys The array of property keys to make required.
   * @returns The new object shape.
   * @template K The array of string keys.
   */
  required<K extends StringKeyof<P>[]>(keys: K): ObjectShape<Omit<P, K[number]> & RequiredProps<Pick<P, K[number]>>, R>;

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
   * @returns The new object shape.
   */
  strip(): ObjectShape<P, null> {
    return copyUnsafeChecks(this, new ObjectShape(this.shapes, null, this._options, 'stripped'));
  }

  /**
   * Returns an object shape that has an index signature that doesn't constrain values.
   *
   * @returns The new object shape.
   */
  preserve(): ObjectShape<P, null> {
    return copyUnsafeChecks(this, new ObjectShape(this.shapes, null, this._options));
  }

  /**
   * Returns an object shape that has an index signature that is constrained by the given shape.
   *
   * @param restShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures), or `null`
   * if there's no index signature.
   * @returns The new object shape.
   * @template T The index signature shape.
   */
  rest<T extends AnyShape | null>(restShape: T): ObjectShape<P, T> {
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
    const shape = cloneInstance(this);
    shape._typePredicate = isPlainObject;
    return shape;
  }

  protected _isAsync(): boolean {
    return this.restShape?.isAsync || this._valueShapes.some(isAsyncShape);
  }

  protected _getInputTypes(): readonly ValueType[] {
    return [TYPE_OBJECT];
  }

  protected _apply(input: any, options: ApplyOptions): Result<InferObject<P, R, 'output'>> {
    if (!this._typePredicate(input)) {
      return this._typeIssueFactory(input, options);
    }
    if (this.keysMode === 'preserved' && this.restShape === null) {
      return this._applyRestUnchecked(input, options);
    } else {
      return this._applyRestChecked(input, options);
    }
  }

  protected _applyAsync(input: any, options: ApplyOptions): Promise<Result<InferObject<P, R, 'output'>>> {
    return new Promise(resolve => {
      if (!this._typePredicate(input)) {
        resolve(this._typeIssueFactory(input, options));
        return;
      }

      const { keys, keysMode, restShape, _valueShapes, _applyChecks, _isUnsafe } = this;

      const keysLength = keys.length;

      let issues: Issue[] | null = null;
      let output = input;

      let seenCount = 0;
      let seenBitmask: Bitmask = 0;

      let unknownKeys: string[] | null = null;

      const entries: [key: string, value: unknown, shape: AnyShape][] = [];

      for (const key in input) {
        const value = input[key];
        const index = keys.indexOf(key as StringKeyof<P>);

        let valueShape: AnyShape | null = restShape;

        if (index !== -1) {
          seenCount++;
          seenBitmask = toggleBit(seenBitmask, index);

          valueShape = _valueShapes[index];
        }

        if (valueShape !== null) {
          entries.push([key, value, valueShape]);
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
          output = cloneDictKeys(input, keys);
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
          if (getBit(seenBitmask, i) === 0) {
            const key = keys[i];
            entries.push([key, input[key], _valueShapes[i]]);
          }
        }
      }

      const entriesLength = entries.length;

      let index = -1;
      let key: string;

      const handleValueResult = (result: Result) => {
        if (result !== null) {
          if (isArray(result)) {
            unshiftIssuesPath(result, key);

            if (!options.verbose) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else if (_isUnsafe || issues === null) {
            if (input === output) {
              output = cloneDict(input);
            }
            setObjectProperty(output, key, result.value);
          }
        }
        return next();
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== entriesLength) {
          const entry = entries[index];
          key = entry[0];
          return applyShape(entry[2], entry[1], options, handleValueResult);
        }

        if (_applyChecks !== null && (_isUnsafe || issues === null)) {
          issues = _applyChecks(output, issues, options);
        }
        if (issues === null && input !== output) {
          return ok(output);
        }
        return issues;
      };

      resolve(next());
    });
  }

  /**
   * Unknown keys are preserved as is and aren't checked.
   */
  private _applyRestUnchecked(input: ReadonlyDict, options: ApplyOptions): Result {
    const { keys, _valueShapes, _applyChecks, _isUnsafe } = this;

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
        unshiftIssuesPath(result, key);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if (_isUnsafe || issues === null) {
        if (input === output) {
          output = cloneDict(input);
        }
        setObjectProperty(output, key, result.value);
      }
    }

    if (_applyChecks !== null && (_isUnsafe || issues === null)) {
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
  private _applyRestChecked(input: ReadonlyDict, options: ApplyOptions): Result {
    const { keys, keysMode, restShape, _valueShapes, _applyChecks, _isUnsafe } = this;

    const keysLength = keys.length;

    let issues = null;
    let output = input;

    let seenCount = 0;
    let seenBitmask: Bitmask = 0;

    let unknownKeys = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as StringKeyof<P>);

      let valueShape: AnyShape | null = restShape;

      // The key is known
      if (index !== -1) {
        seenCount++;
        seenBitmask = toggleBit(seenBitmask, index);

        valueShape = _valueShapes[index];
      }

      // The key is known or indexed
      if (valueShape !== null) {
        const result = valueShape['_apply'](value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftIssuesPath(result, key);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (_isUnsafe || issues === null) {
          if (input === output) {
            output = restShape === null ? cloneDictKeys(input, keys) : cloneDict(input);
          }
          setObjectProperty(output, key, result.value);
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
      if (input === output && (_isUnsafe || issues === null)) {
        output = cloneDictKeys(input, keys);
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
        if (getBit(seenBitmask, i) === 1) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = _valueShapes[i]['_apply'](value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftIssuesPath(result, key);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (_isUnsafe || issues === null) {
          if (input === output) {
            output = cloneDict(input);
          }
          setObjectProperty(output, key, result.value);
        }
      }
    }

    if (_applyChecks !== null && (_isUnsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }
}
