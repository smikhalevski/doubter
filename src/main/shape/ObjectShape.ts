import { CODE_OBJECT_EXACT, CODE_TYPE } from '../constants';
import { Bitmask, getBit, toggleBit } from '../internal/bitmasks';
import { freeze, isArray, isObject } from '../internal/lang';
import { cloneDict, cloneDictKeys, Dict, overrideProperty, ReadonlyDict, setObjectProperty } from '../internal/objects';
import {
  applyShape,
  concatIssues,
  copyOperations,
  INPUT,
  isAsyncShapes,
  OUTPUT,
  toDeepPartialShape,
  unshiftIssuesPath,
} from '../internal/shapes';
import { Type } from '../Type';
import { ApplyOptions, Issue, IssueOptions, Message, Result } from '../types';
import { createIssueFactory } from '../utils';
import { EnumShape } from './EnumShape';
import { AllowShape, AnyShape, DeepPartialProtocol, DenyShape, OptionalDeepPartialShape, Shape } from './Shape';

const objectInputs = freeze([Type.OBJECT]);

type InferObject<
  PropShapes extends ReadonlyDict<AnyShape>,
  RestShape extends AnyShape | null,
  Leg extends INPUT | OUTPUT,
> = Prettify<
  UndefinedToOptional<{ [K in keyof PropShapes]: PropShapes[K][Leg] }> &
    (RestShape extends null | undefined ? {} : RestShape extends Shape ? { [key: string]: RestShape[Leg] } : {})
>;

type UndefinedToOptional<T> = Omit<T, OptionalKeys<T>> & { [K in OptionalKeys<T>]?: T[K] };

// Extract is required for disabled strictNullChecks
type OptionalKeys<T> = { [K in keyof T]: undefined extends Extract<T[K], undefined> ? K : never }[keyof T];

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type OptionalPropShapes<PropShapes extends ReadonlyDict<AnyShape>> = {
  [K in keyof PropShapes]: AllowShape<PropShapes[K], undefined>;
};

type RequiredPropShapes<PropShapes extends ReadonlyDict<AnyShape>> = {
  [K in keyof PropShapes]: DenyShape<PropShapes[K], undefined>;
};

type DeepPartialObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null> = ObjectShape<
  { [K in keyof PropShapes]: OptionalDeepPartialShape<PropShapes[K]> },
  RestShape extends null | undefined ? null : RestShape extends Shape ? OptionalDeepPartialShape<RestShape> : RestShape
>;

/**
 * Defines how unknown object keys are handled.
 *
 * - If `preserved` then unknown object keys are preserved as-is or checked with {@link ObjectShape.restShape}.
 * - If `stripped` then the input object is cloned and unknown keys are removed from it.
 * - If `exact` then an issue is raised if an unknown key is met.
 *
 * @see {@link ObjectShape.keysMode}
 * @group Other
 */
export type ObjectKeysMode = 'preserved' | 'stripped' | 'exact';

/**
 * The shape of an object.
 *
 * @template PropShapes The mapping from a string object key to a corresponding value shape.
 * @template RestShape The shape that constrains values of
 * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures), or `null`
 * if there's no index signature.
 * @group Shapes
 */
export class ObjectShape<PropShapes extends ReadonlyDict<AnyShape>, RestShape extends AnyShape | null>
  extends Shape<InferObject<PropShapes, RestShape, INPUT>, InferObject<PropShapes, RestShape, OUTPUT>>
  implements DeepPartialProtocol<DeepPartialObjectShape<PropShapes, RestShape>>
{
  /**
   * The array of known object keys.
   */
  readonly keys: readonly string[];

  /**
   * The array of property shapes, parallel to {@link ObjectShape.keys}.
   */
  readonly valueShapes: readonly Shape[];

  /**
   * The issue options or the issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Returns issues which describe that an object has unknown properties.
   */
  protected _exactIssueFactory?: (input: unknown, options: ApplyOptions, param: unknown) => Issue;

  /**
   * Creates a new {@link ObjectShape} instance.
   *
   * @param propShapes The mapping from an object key to a corresponding value shape.
   * @param restShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures). If `null`
   * then values thea fall under the index signature are unconstrained.
   * @param options The issue options or the issue message.
   * @param keysMode The mode of keys handling.
   * @template PropShapes The mapping from an object key to a corresponding value shape.
   * @template RestShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
   */
  constructor(
    /**
     * The mapping from an object key to a corresponding value shape.
     */
    readonly propShapes: PropShapes,
    /**
     * The shape that constrains values of
     * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
     *
     * @see {@link ObjectShape.rest}
     */
    readonly restShape: RestShape,
    options?: IssueOptions | Message,
    /**
     * The mode of unknown keys handling.
     *
     * - If `preserved` then unknown object keys are preserved as-is or checked with {@link ObjectShape.restShape}.
     * - If `stripped` then the input object is cloned and unknown keys are removed from it.
     * - If `exact` then an issue is raised if an unknown key is met.
     *
     * @default 'preserved'
     */
    readonly keysMode: ObjectKeysMode = 'preserved'
  ) {
    super();

    this.keys = Object.keys(propShapes);
    this.valueShapes = Object.values(propShapes);

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE, Shape.messages['type.object'], options, Type.OBJECT);
  }

  /**
   * The enum shape that describes object keys.
   */
  get keysShape(): EnumShape<keyof PropShapes> {
    return overrideProperty(this, 'keysShape', new EnumShape(this.keys));
  }

  at(key: any): AnyShape | null {
    return this.propShapes.hasOwnProperty(key) ? this.propShapes[key] : this.restShape;
  }

  /**
   * Merge properties from the other object shape.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * If a property with the same key already exists on this object shape then it is overwritten. The index signature of
   * this shape and its {@link ObjectShape.keysMode} is preserved intact.
   *
   * @param shape The object shape which properties must be added to this object shape.
   * @returns The new object shape.
   * @template T Properties to add.
   */
  extend<T extends ReadonlyDict<AnyShape>>(
    shape: ObjectShape<T, any>
  ): ObjectShape<Omit<PropShapes, keyof T> & T, RestShape>;

  /**
   * Add properties to an object shape.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * If a property with the same key already exists on this object shape then it is overwritten. The index signature of
   * this shape and its {@link ObjectShape.keysMode} is preserved intact.
   *
   * @param shapes The properties to add.
   * @returns The new object shape.
   * @template T The shapes of properties to add.
   */
  extend<T extends ReadonlyDict<AnyShape>>(shapes: T): ObjectShape<Omit<PropShapes, keyof T> & T, RestShape>;

  extend(shape: ObjectShape<any, any> | ReadonlyDict) {
    const propsShapes = Object.assign({}, this.propShapes, shape instanceof ObjectShape ? shape.propShapes : shape);

    return new ObjectShape(propsShapes, this.restShape, this._options, this.keysMode);
  }

  /**
   * Returns an object shape that only has properties with listed keys.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * @param keys The array of property keys to pick.
   * @returns The new object shape.
   * @template K The tuple of keys to pick.
   */
  pick<K extends ReadonlyArray<keyof PropShapes>>(keys: K): ObjectShape<Pick<PropShapes, K[number]>, RestShape> {
    const propShapes: Dict<AnyShape> = {};

    for (const key in this.propShapes) {
      if (keys.includes(key)) {
        propShapes[key] = this.propShapes[key];
      }
    }
    return new ObjectShape<any, any>(propShapes, this.restShape, this._options, this.keysMode);
  }

  /**
   * Returns an object shape that doesn't have the listed keys.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * @param keys The array of property keys to omit.
   * @returns The new object shape.
   * @template K The tuple of keys to omit.
   */
  omit<K extends ReadonlyArray<keyof PropShapes>>(keys: K): ObjectShape<Omit<PropShapes, K[number]>, RestShape> {
    const propShapes: Dict<AnyShape> = {};

    for (const key in this.propShapes) {
      if (!keys.includes(key)) {
        propShapes[key] = this.propShapes[key];
      }
    }
    return new ObjectShape<any, any>(propShapes, this.restShape, this._options, this.keysMode);
  }

  /**
   * Returns an object shape with all properties marked as optional.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * @returns The new object shape.
   */
  partial(): ObjectShape<OptionalPropShapes<PropShapes>, RestShape>;

  /**
   * Returns an object shape with keys marked as optional.
   *
   * **Note:** This method returns a shape without any operations.
   *
   * @param keys The array of property keys to make optional.
   * @returns The new object shape.
   * @template K The array of string keys.
   */
  partial<K extends ReadonlyArray<keyof PropShapes>>(
    keys: K
  ): ObjectShape<Omit<PropShapes, K[number]> & OptionalPropShapes<Pick<PropShapes, K[number]>>, RestShape>;

  partial(keys?: string[]) {
    const propShapes: Dict<AnyShape> = {};

    for (const key in this.propShapes) {
      propShapes[key] =
        keys === undefined || keys.includes(key) ? this.propShapes[key].optional() : this.propShapes[key];
    }
    return new ObjectShape<any, any>(propShapes, this.restShape, this._options, this.keysMode);
  }

  deepPartial(): DeepPartialObjectShape<PropShapes, RestShape> {
    const propShapes: Dict<AnyShape> = {};

    for (const key in this.propShapes) {
      propShapes[key] = toDeepPartialShape(this.propShapes[key]).optional();
    }

    const restShape = this.restShape !== null ? toDeepPartialShape(this.restShape).optional() : null;

    return new ObjectShape<any, any>(propShapes, restShape, this._options, this.keysMode);
  }

  /**
   * Returns an object shape with all properties marked as required.
   *
   * @returns The new object shape.
   */
  required(): ObjectShape<RequiredPropShapes<PropShapes>, RestShape>;

  /**
   * Returns an object shape with keys marked as required.
   *
   * @param keys The array of property keys to make required.
   * @returns The new object shape.
   * @template K The array of string keys.
   */
  required<K extends ReadonlyArray<keyof PropShapes>>(
    keys: K
  ): ObjectShape<Omit<PropShapes, K[number]> & RequiredPropShapes<Pick<PropShapes, K[number]>>, RestShape>;

  required(keys?: string[]) {
    const propShapes: Dict<AnyShape> = {};

    for (const key in this.propShapes) {
      propShapes[key] =
        keys === undefined || keys.includes(key) ? this.propShapes[key].nonOptional() : this.propShapes[key];
    }
    return copyOperations(this, new ObjectShape<any, any>(propShapes, this.restShape, this._options, this.keysMode));
  }

  /**
   * Returns an object shape that allows only known keys and has no index signature.
   *
   * @param options The issue options or the issue message.
   * @returns The new object shape.
   */
  exact(options?: IssueOptions | Message): ObjectShape<PropShapes, null> {
    const shape = new ObjectShape(this.propShapes, null, this._options, 'exact');

    shape._exactIssueFactory = createIssueFactory(CODE_OBJECT_EXACT, Shape.messages[CODE_OBJECT_EXACT], options);

    return copyOperations(this, shape);
  }

  /**
   * Returns an object shape that doesn't have an index signature and all unknown keys are stripped.
   *
   * @returns The new object shape.
   */
  strip(): ObjectShape<PropShapes, null> {
    return copyOperations(this, new ObjectShape(this.propShapes, null, this._options, 'stripped'));
  }

  /**
   * Returns an object shape that has an index signature that doesn't constrain values.
   *
   * @returns The new object shape.
   */
  preserve(): ObjectShape<PropShapes, null> {
    return copyOperations(this, new ObjectShape(this.propShapes, null, this._options));
  }

  /**
   * Returns an object shape that has an index signature that is constrained by the given shape.
   *
   * @param restShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures), or `null`
   * if there's no index signature.
   * @returns The new object shape.
   * @template S The index signature shape.
   */
  rest<S extends AnyShape | null>(restShape: S): ObjectShape<PropShapes, S> {
    return copyOperations(this, new ObjectShape(this.propShapes, restShape, this._options));
  }

  protected _isAsync(): boolean {
    return this.restShape?.isAsync || isAsyncShapes(this.valueShapes);
  }

  protected _getInputs(): readonly unknown[] {
    return objectInputs;
  }

  protected _apply(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Result<InferObject<PropShapes, RestShape, OUTPUT>> {
    if (!isObject(input)) {
      return [this._typeIssueFactory(input, options)];
    }
    if (this.keysMode === 'preserved' && this.restShape === null) {
      return this._applyRestUnchecked(input, options, nonce);
    } else {
      return this._applyRestChecked(input, options, nonce);
    }
  }

  protected _applyAsync(
    input: any,
    options: ApplyOptions,
    nonce: number
  ): Promise<Result<InferObject<PropShapes, RestShape, OUTPUT>>> {
    return new Promise(resolve => {
      if (!isObject(input)) {
        resolve([this._typeIssueFactory(input, options)]);
        return;
      }

      const { keys, keysMode, restShape, operations, valueShapes } = this;

      const keysLength = keys.length;

      let issues: Issue[] | null = null;
      let output = input;

      let seenCount = 0;
      let seenBitmask: Bitmask = 0;

      let unknownKeys: string[] | null = null;

      const entries: [key: string, value: unknown, shape: AnyShape][] = [];

      for (const key in input) {
        const value = input[key];
        const index = keys.indexOf(key);

        let valueShape: AnyShape | null = restShape;

        if (index !== -1) {
          seenCount++;
          seenBitmask = toggleBit(seenBitmask, index);

          valueShape = valueShapes[index];
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

          if (options.earlyReturn) {
            break;
          }
          continue;
        }

        if (input === output && keysMode === 'stripped') {
          output = cloneDictKeys(input, keys);
        }
      }

      if (unknownKeys !== null) {
        issues = [this._exactIssueFactory!(input, options, unknownKeys)];

        if (options.earlyReturn) {
          resolve(issues);
          return;
        }
      }

      if (seenCount !== keysLength) {
        for (let i = 0; i < keysLength; ++i) {
          if (getBit(seenBitmask, i) === 0) {
            const key = keys[i];
            entries.push([key, input[key], valueShapes[i]]);
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

            if (options.earlyReturn) {
              return result;
            }
            issues = concatIssues(issues, result);
          } else if (issues === null || operations.length !== 0) {
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
          return applyShape(entry[2], entry[1], options, nonce, handleValueResult);
        }
        return this._applyOperations(input, output, options, issues);
      };

      resolve(next());
    });
  }

  /**
   * Unknown keys are preserved as is and aren't checked.
   */
  private _applyRestUnchecked(input: ReadonlyDict, options: ApplyOptions, nonce: number): Result {
    const { keys, operations, valueShapes } = this;

    const keysLength = keys.length;

    let issues = null;
    let output = input;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const value = input[key];
      const result = valueShapes[i]['_apply'](value, options, nonce);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftIssuesPath(result, key);

        if (options.earlyReturn) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if (issues === null || operations.length !== 0) {
        if (input === output) {
          output = cloneDict(input);
        }
        setObjectProperty(output, key, result.value);
      }
    }
    return this._applyOperations(input, output, options, issues) as Result;
  }

  /**
   * Unknown keys are either parsed with a {@link ObjectShape.restShape}, stripped, or cause an issue.
   */
  private _applyRestChecked(input: ReadonlyDict, options: ApplyOptions, nonce: number): Result {
    const { keys, keysMode, restShape, operations, valueShapes } = this;

    const keysLength = keys.length;

    let issues = null;
    let output = input;

    let seenCount = 0;
    let seenBitmask: Bitmask = 0;

    let unknownKeys = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key);

      let valueShape: AnyShape | null = restShape;

      // The key is known
      if (index !== -1) {
        seenCount++;
        seenBitmask = toggleBit(seenBitmask, index);

        valueShape = valueShapes[index];
      }

      // The key is known or indexed
      if (valueShape !== null) {
        const result = valueShape['_apply'](value, options, nonce);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftIssuesPath(result, key);

          if (options.earlyReturn) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (issues === null || operations.length !== 0) {
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

        if (options.earlyReturn) {
          break;
        }
        continue;
      }

      // Unknown keys are stripped
      if (input === output && (issues === null || operations.length !== 0)) {
        output = cloneDictKeys(input, keys);
      }
    }

    // Raise unknown keys issue
    if (unknownKeys !== null) {
      const issue = this._exactIssueFactory!(input, options, unknownKeys);

      if (options.earlyReturn) {
        return [issue];
      }
      (issues ||= []).push(issue);
    }

    // Parse absent known keys
    if (seenCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (getBit(seenBitmask, i) === 1) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = valueShapes[i]['_apply'](value, options, nonce);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftIssuesPath(result, key);

          if (options.earlyReturn) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if (issues === null || operations.length !== 0) {
          if (input === output) {
            output = cloneDict(input);
          }
          setObjectProperty(output, key, result.value);
        }
      }
    }
    return this._applyOperations(input, output, options, issues) as Result;
  }
}
