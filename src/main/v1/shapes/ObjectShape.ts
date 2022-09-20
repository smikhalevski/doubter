import { AnyShape, Shape } from './Shape';
import { ApplyConstraints, InputConstraintOptions, Issue, ObjectLike, ParserOptions } from '../shared-types';
import {
  captureIssuesForKey,
  createCatchForKey,
  isAsyncShapes,
  isEqual,
  isObjectLike,
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

type Preprocessor = (input: ObjectLike) => ObjectLike;

type ApplyIndexer = (
  input: ObjectLike,
  output: ObjectLike,
  options: ParserOptions | undefined,
  issues: Issue[] | null,
  applyConstraints: ApplyConstraints<any> | null
) => ObjectLike;

export enum UnknownKeysMode {
  IGNORED = 'ignored',
  STRIPPED = 'stripped',
  FORBIDDEN = 'forbidden',
}

export class ObjectShape<P extends ObjectLike<AnyShape>, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  readonly knownKeys: Array<keyof P>;

  private _valueShapes: any[] = [];
  private _preprocessor: Preprocessor | null = null;
  private _applyIndexer: ApplyIndexer | null = null;

  constructor(
    readonly propertyShapes: Readonly<P>,
    readonly indexerShape: I | null = null,
    readonly unknownKeysMode: UnknownKeysMode = UnknownKeysMode.IGNORED,
    private _options?: InputConstraintOptions
  ) {
    const knownKeys = Object.keys(propertyShapes);
    const valueShapes = Object.values(propertyShapes);

    super(indexerShape?.async || isAsyncShapes(valueShapes));

    this.knownKeys = knownKeys;
    this._valueShapes = valueShapes;

    if (indexerShape !== null) {
      this._applyIndexer = createApplyIndexer(knownKeys, indexerShape);
    }
  }

  at(key: unknown): AnyShape | null {
    const { indexerShape } = this;
    return typeof key !== 'string' ? null : this.knownKeys.includes(key) ? this.propertyShapes[key] : indexerShape;
  }

  extend<T extends ObjectLike<AnyShape>>(
    shape: ObjectShape<T, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends ObjectLike<AnyShape>>(propertyShapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any, AnyShape> | ObjectLike<AnyShape>): ObjectShape<any, I> {
    const propertyShapes = Object.assign(
      {},
      this.propertyShapes,
      shape instanceof ObjectShape ? shape.propertyShapes : shape
    );

    return new ObjectShape(propertyShapes, this.indexerShape, UnknownKeysMode.IGNORED, this._options);
  }

  pick<K extends Array<keyof P>>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const { knownKeys, _valueShapes } = this;
    const propertyShapes: ObjectLike<AnyShape> = {};

    for (let i = 0; i < knownKeys.length; ++i) {
      if (keys.includes(knownKeys[i])) {
        propertyShapes[knownKeys[i]] = _valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(propertyShapes, this.indexerShape, UnknownKeysMode.IGNORED, this._options);
  }

  omit<K extends Array<keyof P>>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const { knownKeys, _valueShapes } = this;
    const propertyShapes: ObjectLike<AnyShape> = {};

    for (let i = 0; i < knownKeys.length; ++i) {
      if (!keys.includes(knownKeys[i])) {
        propertyShapes[knownKeys[i]] = _valueShapes[i];
      }
    }

    return new ObjectShape<any, I>(propertyShapes, this.indexerShape, UnknownKeysMode.IGNORED, this._options);
  }

  exact(options?: InputConstraintOptions): ObjectShape<P> {
    const { propertyShapes } = this;
    const shape = new ObjectShape<P>(propertyShapes, null, UnknownKeysMode.FORBIDDEN, this._options);
    shape._preprocessor = createExactKeysPreprocessor(shape.knownKeys, options);
    return shape;
  }

  strip(): ObjectShape<P> {
    const { propertyShapes } = this;
    const shape = new ObjectShape<P>(propertyShapes, null, UnknownKeysMode.STRIPPED, this._options);
    shape._preprocessor = createStripKeysPreprocessor(shape.knownKeys);
    return shape;
  }

  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.propertyShapes, null, UnknownKeysMode.IGNORED, this._options);
  }

  index<T extends AnyShape>(indexerShape: T): ObjectShape<P, T> {
    return new ObjectShape(this.propertyShapes, indexerShape, UnknownKeysMode.IGNORED, this._options);
  }

  parse(input: unknown, options?: ParserOptions): InferObject<P, I, 'output'> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
    }

    const { knownKeys, _valueShapes, _preprocessor, _applyIndexer, applyConstraints } = this;
    const knownKeysLength = knownKeys.length;

    let issues: Issue[] | null = null;
    let output = input;

    if (_preprocessor !== null) {
      try {
        output = _preprocessor(input);
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, issues);
      }
    }

    for (let i = 0; i < knownKeysLength; ++i) {
      const knownKey = knownKeys[i];
      const inputValue = input[knownKey];

      let valid = true;
      let outputValue = INVALID;
      try {
        outputValue = _valueShapes[i].parse(inputValue, options);
      } catch (error) {
        valid = false;
        issues = raiseOrCaptureIssuesForKey(error, options, issues, knownKey);
      }
      if (valid && isEqual(outputValue, inputValue)) {
        continue;
      }
      if (output === input) {
        output = cloneObjectLike(input);
      }
      output[knownKey] = outputValue;
    }

    if (_applyIndexer !== null) {
      return _applyIndexer(input, output, options, issues, applyConstraints) as InferObject<P, I, 'output'>;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output as InferObject<P, I, 'output'>, options, issues);
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

      const { knownKeys, _valueShapes, _preprocessor, indexerShape, applyConstraints } = this;
      const knownKeysLength = knownKeys.length;

      let issues: Issue[] | null = null;
      let output = input;

      if (_preprocessor !== null) {
        try {
          output = _preprocessor(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }

      let keys = knownKeys;

      const promises = [];

      for (let i = 0; i < knownKeysLength; ++i) {
        const knownKey = knownKeys[i];
        promises.push(_valueShapes[i].parseAsync(input[knownKey], options));
      }

      if (indexerShape !== null) {
        keys = keys.slice(0);

        for (const key in input) {
          if (!knownKeys.includes(key)) {
            keys.push(key);
            promises.push(indexerShape.parseAsync(input[key], options));
          }
        }
      }

      if (options !== undefined && options.fast) {
        for (let i = 0; i < promises.length; ++i) {
          promises[i] = promises[i].catch(createCatchForKey(keys[i]));
        }
        resolve(Promise.all(promises).then(createFastResolveObject(keys, input, output, applyConstraints, options)));
        return;
      }

      resolve(
        Promise.allSettled(promises).then(createResolveObject(keys, input, output, applyConstraints, options, issues))
      );
    });
  }
}

function createExactKeysPreprocessor(
  knownKeys: PropertyKey[],
  options: InputConstraintOptions | undefined
): Preprocessor {
  return input => {
    let unknownKeys: string[] | null = null;

    for (const key in input) {
      if (!knownKeys.includes(key)) {
        (unknownKeys ||= []).push(key);
      }
    }
    if (unknownKeys !== null) {
      raiseIssue(input, 'unknownKeys', unknownKeys, options, 'Must not have unknown keys');
    }
    return input;
  };
}

function createStripKeysPreprocessor(knownKeys: PropertyKey[]): Preprocessor {
  const knownKeysLength = knownKeys.length;

  return input => {
    for (const key in input) {
      if (knownKeys.includes(key)) {
        continue;
      }
      const output: ObjectLike = {};

      for (let i = 0; i < knownKeysLength; ++i) {
        const key = knownKeys[i];

        if (key in input) {
          output[key] = input[key];
        }
      }
      return output;
    }
    return input;
  };
}

function createApplyIndexer(keys: PropertyKey[], indexerShape: AnyShape): ApplyIndexer {
  return (input, output, options, issues, applyConstraints) => {
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

    if (applyConstraints !== null) {
      issues = applyConstraints(output, options, issues);
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

function createFastResolveObject(
  keys: PropertyKey[],
  input: ObjectLike,
  output: ObjectLike,
  applyConstraints: ApplyConstraints<any> | null,
  options: ParserOptions | undefined
): (outputValues: unknown[]) => any {
  return outputValues => {
    const keysLength = keys.length;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const outputValue = outputValues[i];

      if (isEqual(outputValue, input[key])) {
        continue;
      }
      if (output === input) {
        output = cloneObjectLike(input);
      }
      output[key] = outputValue;
    }

    if (applyConstraints !== null) {
      applyConstraints(output, options, null);
    }
    return output;
  };
}

function createResolveObject(
  keys: PropertyKey[],
  input: ObjectLike,
  output: ObjectLike,
  applyConstraints: ApplyConstraints<any> | null,
  options: ParserOptions | undefined,
  issues: Issue[] | null
): (results: PromiseSettledResult<unknown>[]) => any {
  return results => {
    const keysLength = keys.length;

    for (let i = 0; i < keysLength; ++i) {
      const result = results[i];
      const key = keys[i];

      let outputValue = INVALID;

      if (result.status === 'fulfilled') {
        outputValue = result.value;

        if (isEqual(outputValue, input[key])) {
          continue;
        }
      } else {
        issues = captureIssuesForKey(issues, result.reason, key);
      }

      if (output === input) {
        output = cloneObjectLike(input);
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
