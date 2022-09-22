import { AnyShape, Shape } from './Shape';
import {
  ApplyConstraints,
  Dict,
  InputConstraintOptionsOrMessage,
  INVALID,
  Issue,
  ParserOptions,
} from '../shared-types';
import {
  createCatchForKey,
  isAsyncShapes,
  isDict,
  isEqual,
  IssuesContext,
  parseAsync,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssues,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { CODE_TYPE, CODE_UNKNOWN_KEYS, MESSAGE_OBJECT_TYPE, MESSAGE_UNKNOWN_KEYS, TYPE_OBJECT } from './constants';

type Channel = 'input' | 'output';

type InferObject<P extends Dict<AnyShape>, I extends AnyShape, C extends Channel> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferIndexer<I, C>
>;

type InferIndexer<I extends AnyShape, C extends Channel> = I extends Shape<any> ? { [indexer: string]: I[C] } : unknown;

type ObjectKeys<T extends object> = StringPropertyKey<keyof T>;

type StringPropertyKey<K extends PropertyKey> = K extends symbol ? never : K extends number ? `${K}` : K;

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type ApplyKeys = (input: Dict) => Dict;

type ApplyIndexer = (
  input: Dict,
  output: Dict,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  applyConstraints: ApplyConstraints | null
) => Dict;

export enum KeysMode {
  PRESERVED = 'preserved',
  STRIPPED = 'stripped',
  EXACT = 'exact',
}

/**
 * The shape of an object.
 *
 * @template P The mapping from an object key to a corresponding value shape.
 * @template I The shape that constrains values of
 * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures).
 */
export class ObjectShape<P extends Dict<AnyShape>, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  /**
   * The array of known object keys.
   */
  readonly keys: readonly ObjectKeys<P>[];

  private _valueShapes: AnyShape[] = [];
  private _applyKeys: ApplyKeys | null = null;
  private _applyIndexer: ApplyIndexer | null = null;

  /**
   * Creates a new {@linkcode ObjectShape} instance.
   *
   * @param shapes The mapping from an object key to a corresponding value shape.
   * @param indexerShape The shape that constrains values of
   * [a string index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures). If `null`
   * then values thea fall under the indexer signature are unconstrained.
   * @param options The type constraint options.
   * @param keysMode
   */
  constructor(
    readonly shapes: Readonly<P>,
    readonly indexerShape: I | null = null,
    protected options?: InputConstraintOptionsOrMessage,
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    const keys = Object.keys(shapes);
    const valueShapes = Object.values(shapes);

    super((indexerShape !== null && indexerShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys as ObjectKeys<P>[];
    this._valueShapes = valueShapes;

    if (indexerShape !== null) {
      this._applyIndexer = createApplyIndexer(keys, indexerShape);
    }
  }

  at(key: any): AnyShape | null {
    return this.shapes.hasOwnProperty(key) ? this.shapes[key] : this.indexerShape;
  }

  /**
   * Merge properties from the other object shape. If a property with the same key already exists on this object shape
   * then it is overwritten. Indexer signature of this shape is preserved intact.
   *
   * @param shape The object shape which properties must be added to this object shape.
   * @returns The new object shape.
   *
   * @template T The type of properties to add.
   */
  extend<T extends Dict<AnyShape>>(
    shape: ObjectShape<T, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  /**
   * Add properties to an object shape. If a property with the same key already exists on this object shape then it is
   * overwritten.
   *
   * @param shapes The properties to add.
   * @returns The new object shape.
   *
   * @template T The shapes of properties to add.
   */
  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any, AnyShape> | Dict<AnyShape>): ObjectShape<any, I> {
    const shapes = Object.assign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.indexerShape, this.options);
  }

  /**
   * Returns an object shape that only has properties with listed keys.
   *
   * @param keys The list of property keys to pick.
   * @returns The new object shape.
   *
   * @template K The tuple of keys to pick.
   */
  pick<K extends ObjectKeys<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, this.options);
  }

  /**
   * Returns an object shape that doesn't have the listed keys.
   *
   * @param keys The list of property keys to omit.
   * @returns The new object shape.
   *
   * @template K The tuple of keys to omit.
   */
  omit<K extends ObjectKeys<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (!keys.includes(key)) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, this.options);
  }

  /**
   * Returns an object shape that allows only known keys and has no index signature. The returned object shape would
   * have no custom constraints.
   *
   * @param options The constraint options or an issue message.
   * @returns The new object shape.
   */
  exact(options?: InputConstraintOptionsOrMessage): ObjectShape<P> {
    const shape = new ObjectShape<P>(this.shapes, null, this.options, KeysMode.EXACT);
    shape._applyKeys = createApplyExactKeys(shape.keys, options);
    return shape;
  }

  /**
   * Returns an object shape that doesn't have indexer signature and all unknown keys are stripped. The returned object
   * shape would have no custom constraints.
   *
   * @returns The new object shape.
   */
  strip(): ObjectShape<P> {
    const shape = new ObjectShape<P>(this.shapes, null, this.options, KeysMode.STRIPPED);
    shape._applyKeys = createApplyStripKeys(shape.keys);
    return shape;
  }

  /**
   * Returns an object shape that has an indexer signature that doesn't constrain values. The returned object shape
   * would have no custom constraints.
   *
   * @returns The new object shape.
   */
  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this.options);
  }

  /**
   * Returns an object shape that has an indexer signature that is constrained by the given shape. The returned object
   * shape would have no custom constraints.
   *
   * @param indexerShape The shape of the indexer values.
   * @returns The new object shape.
   *
   * @template T The indexer signature shape.
   */
  index<T extends AnyShape>(indexerShape: T): ObjectShape<P, T> {
    return new ObjectShape(this.shapes, indexerShape, this.options);
  }

  parse(input: unknown, options?: ParserOptions): InferObject<P, I, 'output'> {
    if (!isDict(input)) {
      raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this.options, MESSAGE_OBJECT_TYPE);
    }

    const { keys, _valueShapes, _applyKeys, _applyIndexer, applyConstraints } = this;
    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    if (_applyKeys !== null) {
      try {
        output = _applyKeys(input);
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, null);
      }
    }

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const inputValue = input[key];

      let outputValue = INVALID;
      try {
        outputValue = _valueShapes[i].parse(inputValue, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
      }
      if (isEqual(outputValue, inputValue)) {
        continue;
      }
      if (output === input) {
        output = cloneDict(input);
      }
      output[key] = outputValue;
    }

    if (_applyIndexer !== null) {
      return _applyIndexer(input, output, options, issues, applyConstraints) as InferObject<P, I, 'output'>;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
    }
    raiseIfIssues(issues);

    return output as InferObject<P, I, 'output'>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferObject<P, I, 'output'>> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isDict(input)) {
        raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this.options, MESSAGE_OBJECT_TYPE);
      }

      const { keys, _valueShapes, _applyKeys, indexerShape, applyConstraints } = this;

      let context: IssuesContext = { issues: null };
      let output = input;

      if (_applyKeys !== null) {
        try {
          output = _applyKeys(input);
        } catch (error) {
          context.issues = raiseOrCaptureIssues(error, options, null);
        }
      }

      const entryPromises: any[] = [];

      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        entryPromises.push(
          key,
          _valueShapes[i].parseAsync(input[key], options).catch(createCatchForKey(key, options, context))
        );
      }

      if (indexerShape !== null) {
        for (const key in input) {
          if (!keys.includes(key as ObjectKeys<P>)) {
            entryPromises.push(
              key,
              indexerShape.parseAsync(input[key], options).catch(createCatchForKey(key, options, context))
            );
          }
        }
      }

      const promise = Promise.all(entryPromises).then(entries => {
        for (let i = 0; i < entries.length; i += 2) {
          const key = entries[i];
          const inputValue = input[key];
          const outputValue = entries[i + 1];

          if (isEqual(outputValue, inputValue)) {
            continue;
          }
          if (output === input) {
            output = cloneDict(input);
          }
          output[key] = outputValue;
        }

        let { issues } = context;

        if (applyConstraints !== null) {
          issues = applyConstraints(output, options, issues);
        }
        raiseIfIssues(issues);

        return output as InferObject<P, I, 'output'>;
      });

      resolve(promise);
    });
  }
}

function createApplyExactKeys(
  keys: readonly string[],
  options: InputConstraintOptionsOrMessage | undefined
): ApplyKeys {
  return input => {
    let unknownKeys: string[] | null = null;

    for (const key in input) {
      if (!keys.includes(key)) {
        (unknownKeys ||= []).push(key);
      }
    }
    if (unknownKeys !== null) {
      raiseIssue(input, CODE_UNKNOWN_KEYS, unknownKeys, options, MESSAGE_UNKNOWN_KEYS);
    }
    return input;
  };
}

function createApplyStripKeys(keys: readonly string[]): ApplyKeys {
  const keysLength = keys.length;

  return input => {
    for (const key in input) {
      if (keys.includes(key)) {
        continue;
      }
      const output: Dict = {};

      for (let i = 0; i < keysLength; ++i) {
        const key = keys[i];

        if (key in input) {
          output[key] = input[key];
        }
      }
      return output;
    }
    return input;
  };
}

function createApplyIndexer(keys: readonly string[], indexerShape: AnyShape): ApplyIndexer {
  return (input, output, options, issues, applyConstraints) => {
    for (const key in input) {
      if (keys.includes(key)) {
        continue;
      }

      const inputValue = input[key];

      let outputValue = INVALID;
      try {
        outputValue = indexerShape.parse(inputValue, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
      }
      if (isEqual(outputValue, inputValue)) {
        continue;
      }
      if (output === input) {
        output = cloneDict(input);
      }
      output[key] = outputValue;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
    }
    raiseIfIssues(issues);

    return output;
  };
}

function cloneDict(input: Dict): Dict {
  const output: Dict = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}
