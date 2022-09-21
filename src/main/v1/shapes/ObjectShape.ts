import { AnyShape, Shape } from './Shape';
import { ConstraintsProcessor, InputConstraintOptions, Issue, ObjectLike, ParserOptions } from '../shared-types';
import {
  createCatchForKey,
  isAsyncShapes,
  isEqual,
  isObjectLike,
  IssuesContext,
  parseAsync,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssues,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { INVALID, TYPE_CODE } from './issue-codes';

type Channel = 'input' | 'output';

type InferObject<P extends ObjectLike<AnyShape>, I extends AnyShape, C extends Channel> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferIndexer<I, C>
>;

type InferIndexer<I extends AnyShape, C extends Channel> = I extends Shape<any> ? { [indexer: string]: I[C] } : unknown;

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

type KeysProcessor = (input: ObjectLike) => ObjectLike;

type IndexerProcessor = (
  input: ObjectLike,
  output: ObjectLike,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  constraintsProcessor: ConstraintsProcessor<any> | null
) => ObjectLike;

export enum UnknownKeysMode {
  PRESERVED = 'preserved',
  STRIPPED = 'stripped',
  EXACT = 'exact',
}

export class ObjectShape<P extends ObjectLike<AnyShape>, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  readonly keys: ReadonlyArray<keyof P>;
  readonly keysMode: UnknownKeysMode = UnknownKeysMode.PRESERVED;

  private _valueShapes: AnyShape[] = [];
  private _keysProcessor: KeysProcessor | null = null;
  private _indexerProcessor: IndexerProcessor | null = null;

  constructor(
    readonly shapes: Readonly<P>,
    readonly indexerShape: I | null = null,
    private _options?: InputConstraintOptions
  ) {
    const keys = Object.keys(shapes);
    const valueShapes = Object.values(shapes);

    super((indexerShape !== null && indexerShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys;
    this._valueShapes = valueShapes;

    if (indexerShape !== null) {
      this._indexerProcessor = createIndexerProcessor(keys, indexerShape);
    }
  }

  at(key: any): AnyShape | null {
    return this.shapes.hasOwnProperty(key) ? this.shapes[key] : this.indexerShape;
  }

  extend<T extends ObjectLike<AnyShape>>(
    shape: ObjectShape<T, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends ObjectLike<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any, AnyShape> | ObjectLike<AnyShape>): ObjectShape<any, I> {
    const shapes = Object.assign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.indexerShape, this._options);
  }

  pick<K extends Array<keyof P>>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const knownKeys = this.keys;
    const shapes: ObjectLike<AnyShape> = {};

    for (let i = 0; i < knownKeys.length; ++i) {
      if (keys.includes(knownKeys[i])) {
        shapes[knownKeys[i]] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, this._options);
  }

  omit<K extends Array<keyof P>>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const knownKeys = this.keys;
    const shapes: ObjectLike<AnyShape> = {};

    for (let i = 0; i < knownKeys.length; ++i) {
      if (!keys.includes(knownKeys[i])) {
        shapes[knownKeys[i]] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(shapes, this.indexerShape, this._options);
  }

  exact(options?: InputConstraintOptions): ObjectShape<P> {
    const shape = new ObjectShape<P>(this.shapes, null, this._options);

    (shape as Mutable<ObjectShape<P>>).keysMode = UnknownKeysMode.EXACT;
    shape._keysProcessor = createExactKeysProcessor(shape.keys, options);

    return shape;
  }

  strip(): ObjectShape<P> {
    const shape = new ObjectShape<P>(this.shapes, null, this._options);

    (shape as Mutable<ObjectShape<P>>).keysMode = UnknownKeysMode.STRIPPED;
    shape._keysProcessor = createStripKeysProcessor(shape.keys);

    return shape;
  }

  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options);
  }

  index<T extends AnyShape>(indexerShape: T): ObjectShape<P, T> {
    return new ObjectShape(this.shapes, indexerShape, this._options);
  }

  parse(input: unknown, options?: ParserOptions): InferObject<P, I, 'output'> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
    }

    const { keys, _valueShapes, _keysProcessor, _indexerProcessor, constraintsProcessor } = this;
    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    if (_keysProcessor !== null) {
      try {
        output = _keysProcessor(input);
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, issues);
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
        output = cloneObjectLike(input);
      }
      output[key] = outputValue;
    }

    if (_indexerProcessor !== null) {
      return _indexerProcessor(input, output, options, issues, constraintsProcessor) as InferObject<P, I, 'output'>;
    }

    if (constraintsProcessor !== null) {
      issues = constraintsProcessor(output as InferObject<P, I, 'output'>, options, issues);
    }
    raiseIfIssues(issues);

    return output as InferObject<P, I, 'output'>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferObject<P, I, 'output'>> {
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
      }

      const { keys, _valueShapes, _keysProcessor, indexerShape, constraintsProcessor } = this;

      let issuesContext: IssuesContext = { issues: null };
      let output = input;

      if (_keysProcessor !== null) {
        try {
          output = _keysProcessor(input);
        } catch (error) {
          issuesContext.issues = raiseOrCaptureIssues(error, options, issuesContext.issues);
        }
      }

      const entries: any[] = [];

      for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        entries.push(
          key,
          _valueShapes[i].parseAsync(input[key], options).catch(createCatchForKey(key, options, issuesContext))
        );
      }

      if (indexerShape !== null) {
        for (const key in input) {
          if (!keys.includes(key)) {
            entries.push(
              key,
              indexerShape.parseAsync(input[key], options).catch(createCatchForKey(key, options, issuesContext))
            );
          }
        }
      }

      resolve(
        Promise.all(entries).then(entries => {
          for (let i = 0; i < entries.length; i += 2) {
            const key = entries[i];
            const inputValue = input[key];
            const outputValue = entries[i + 1];

            if (isEqual(outputValue, inputValue)) {
              continue;
            }
            if (output === input) {
              output = cloneObjectLike(input);
            }
            output[key] = outputValue;
          }

          const { issues } = issuesContext;

          if (constraintsProcessor !== null) {
            issuesContext.issues = constraintsProcessor(
              output as InferObject<P, I, 'output'>,
              options,
              issuesContext.issues
            );
          }
          raiseIfIssues(issuesContext.issues);

          return output as InferObject<P, I, 'output'>;
        })
      );
    });
  }
}

function createExactKeysProcessor(
  keys: readonly PropertyKey[],
  options: InputConstraintOptions | undefined
): KeysProcessor {
  return input => {
    let unknownKeys: string[] | null = null;

    for (const key in input) {
      if (!keys.includes(key)) {
        (unknownKeys ||= []).push(key);
      }
    }
    if (unknownKeys !== null) {
      raiseIssue(input, 'unknownKeys', unknownKeys, options, 'Must not have unknown keys');
    }
    return input;
  };
}

function createStripKeysProcessor(keys: readonly PropertyKey[]): KeysProcessor {
  const keysLength = keys.length;

  return input => {
    for (const key in input) {
      if (keys.includes(key)) {
        continue;
      }
      const output: ObjectLike = {};

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

function createIndexerProcessor(keys: PropertyKey[], indexerShape: AnyShape): IndexerProcessor {
  return (input, output, options, issues, constraintsProcessor) => {
    for (const key in input) {
      if (keys.includes(key)) {
        continue;
      }

      const inputValue = input[key];

      let valid = true;
      let outputValue = INVALID;
      try {
        outputValue = indexerShape.parse(inputValue, options);
      } catch (error) {
        valid = false;
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
      }
      if (valid && isEqual(outputValue, inputValue)) {
        continue;
      }
      if (output === input) {
        output = cloneObjectLike(input);
      }
      output[key] = outputValue;
    }

    if (constraintsProcessor !== null) {
      issues = constraintsProcessor(output, options, issues);
    }
    raiseIfIssues(issues);

    return output;
  };
}

function cloneObjectLike(input: ObjectLike): ObjectLike {
  const output: ObjectLike = {};

  for (const key in input) {
    output[key] = input[key];
  }
  return output;
}
