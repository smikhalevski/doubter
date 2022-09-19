import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptions, Issue, ParserOptions } from '../shared-types';
import {
  cloneDict,
  isAsyncShapes,
  isEqual,
  isObjectLike,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssues,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { INVALID, TYPE_CODE } from './issue-codes';

type Channel = 'input' | 'output';

type InferObject<P extends Dict<AnyShape>, I extends AnyShape, C extends Channel> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferIndexer<I, C>
>;

type InferIndexer<I extends AnyShape, C extends Channel> = I extends Shape<any> ? { [indexer: string]: I[C] } : unknown;

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type UnknownKeysProcessor = (input: Dict) => Dict;

const enum UnknownKeysMode {
  PRESERVE,
  STRIP,
  EXACT,
}

export class ObjectShape<P extends Dict<AnyShape>, I extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  private _entries: any[] = [];
  private _unknownKeysProcessor: UnknownKeysProcessor | null = null;

  constructor(
    readonly propertyShapes: Readonly<P>,
    readonly indexerShape: I | null = null,
    readonly unknownKeysMode: UnknownKeysMode = UnknownKeysMode.PRESERVE,
    private _options?: InputConstraintOptions
  ) {
    super(indexerShape?.async || isAsyncShapes(Object.values(propertyShapes)));

    for (const entry of Object.entries(propertyShapes)) {
      this._entries.push(entry[0], entry[1]);
    }

    if (!indexerShape) {
      return;
    }

    const keys = Object.keys(propertyShapes);

    this._applyIndexer = (input, output, options, issues) => {
      for (const key in input) {
        if (keys.includes(key)) {
          continue;
        }

        const inputValue = input[key];

        let parsed = true;
        let outputValue = INVALID;
        try {
          outputValue = indexerShape.parse(inputValue, options);
        } catch (error) {
          parsed = false;
          issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
        }
        if (parsed && isEqual(outputValue, inputValue)) {
          continue;
        }
        if (output === input) {
          output = cloneDict(input);
        }
        output[key] = outputValue;
      }

      const { applyConstraints } = this;
      if (applyConstraints !== null) {
        issues = applyConstraints(output, options, issues);
      }
      raiseIfIssues(issues);

      return output;
    };
  }

  at(key: unknown): AnyShape | null {
    const { propertyShapes, indexerShape } = this;
    return typeof key !== 'string' ? null : propertyShapes.hasOwnProperty(key) ? propertyShapes[key] : indexerShape;
  }

  extend<T extends Dict<AnyShape>>(
    shape: ObjectShape<T, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend<T extends Dict<AnyShape>>(propertyShapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, I>;

  extend(shape: ObjectShape<any, AnyShape> | Dict<AnyShape>): ObjectShape<any, I> {
    const propertyShapes = Object.assign(
      {},
      this.propertyShapes,
      shape instanceof ObjectShape ? shape.propertyShapes : shape
    );

    return new ObjectShape(propertyShapes, this.indexerShape, this.unknownKeysMode, this._options);
  }

  pick<K extends Array<keyof P>>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const { _entries } = this;
    const propertyShapes: Dict<AnyShape> = {};

    for (let i = 0; i < _entries.length; ++i) {
      const [key, value] = _entries[i];

      if (keys.includes(key)) {
        propertyShapes[key] = value;
      }
    }

    return new ObjectShape<any, I>(propertyShapes, this.indexerShape, this.unknownKeysMode, this._options);
  }

  omit<K extends Array<keyof P>>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const { _entries } = this;
    const propertyShapes: Dict<AnyShape> = {};

    for (let i = 0; i < _entries.length; ++i) {
      const [key, value] = _entries[i];

      if (!keys.includes(key)) {
        propertyShapes[key] = value;
      }
    }

    return new ObjectShape<any, I>(propertyShapes, this.indexerShape, this.unknownKeysMode, this._options);
  }

  exact(options?: InputConstraintOptions): ObjectShape<P> {
    const { propertyShapes } = this;

    const keys = Object.keys(propertyShapes);
    const keysLength = keys.length;
    const shape = new ObjectShape<P>(propertyShapes, null, UnknownKeysMode.EXACT, this._options);

    shape._unknownKeysProcessor = input => {
      let knownKeyCount = 0;
      let unknownKeys: string[] | null = null;
      let missingKeys: string[] | null = null;

      for (const key in input) {
        if (keys.includes(key)) {
          ++knownKeyCount;
        } else {
          (unknownKeys ||= []).push(key);
        }
      }
      if (knownKeyCount !== keysLength) {
        for (let i = 0; i < keysLength; ++i) {
          const key = keys[i];

          if (!(key in input)) {
            (missingKeys ||= []).push(key);
          }
        }
      }
      if (unknownKeys !== null || missingKeys !== null) {
        raiseIssue(input, 'exactKeys', { unknownKeys, missingKeys }, options, 'Must have exact keys');
      }
      return input;
    };

    return shape;
  }

  strip(): ObjectShape<P> {
    const { propertyShapes } = this;

    const keys = Object.keys(propertyShapes);
    const keysLength = keys.length;
    const shape = new ObjectShape<P>(propertyShapes, null, UnknownKeysMode.STRIP, this._options);

    shape._unknownKeysProcessor = input => {
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

    return shape;
  }

  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.propertyShapes, null, UnknownKeysMode.PRESERVE, this._options);
  }

  index<T extends AnyShape>(indexerShape: T): ObjectShape<P, T> {
    return new ObjectShape(this.propertyShapes, indexerShape, UnknownKeysMode.PRESERVE, this._options);
  }

  _applyIndexer(input: any, output: any, options: ParserOptions | undefined, issues: Issue[] | null): any {
    const { applyConstraints } = this;
    if (applyConstraints !== null) {
      raiseIfIssues(applyConstraints(output, options, issues));
    }
    return output;
  }

  parse(input: unknown, options?: ParserOptions): InferObject<P, I, 'output'> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
    }

    const { _entries, _unknownKeysProcessor } = this;
    const entriesLength = _entries.length;

    let issues: Issue[] | null = null;
    let output = input;

    if (_unknownKeysProcessor !== null) {
      try {
        output = _unknownKeysProcessor(input);
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, issues);
      }
    }

    for (let i = 0; i < entriesLength; i += 2) {
      const key = _entries[i];
      const inputValue = input[key];

      let parsed = true;
      let outputValue = INVALID;
      try {
        outputValue = _entries[i + 1].parse(inputValue, options);
      } catch (error) {
        parsed = false;
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
      }
      if (parsed && isEqual(outputValue, inputValue)) {
        continue;
      }
      if (output === input) {
        output = cloneDict(input);
      }
      output[key] = outputValue;
    }

    return output as any;
    // return this._applyIndexer(input, output, options, issues);
  }

  // parseAsync(input: unknown, options?: ParserOptions): Promise<InferObject<P, I, 'output'>> {
  //   return new Promise(resolve => {
  //     if (!isObjectLike(input)) {
  //       raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
  //     }
  //     const { _entries, applyConstraints, processKeys } = this;
  //     const entriesLength = _entries.length;
  //
  //     let issues: Issue[] | null = null;
  //     let output = input;
  //
  //     if (processKeys !== null) {
  //       try {
  //         output = processKeys(input);
  //       } catch (error) {
  //         issues = raiseOrCaptureIssues(error, options, issues);
  //       }
  //     }
  //
  //     const promises = [];
  //
  //     for (let i = 0; i < entriesLength; i += 2) {
  //       const key = _entries[i];
  //       promises.push(key, _entries[i + 1].parseAsync(input[key], options).catch(createCatchForKey(key)));
  //     }
  //
  //     const returnOutput = (entries: any[], issues: Issue[] | null = null): any => {
  //       if (issues !== null) {
  //         output = input;
  //       } else {
  //         const entriesLength = entries.length;
  //
  //         for (let i = 0; i < entriesLength; i += 2) {
  //           const key = entries[i];
  //           const outputValue = entries[i + 1];
  //
  //           if (isEqual(outputValue, input[key])) {
  //             continue;
  //           }
  //           if (output === input) {
  //             output = cloneDict(input);
  //           }
  //           output[key] = outputValue;
  //         }
  //       }
  //
  //       if (applyConstraints !== null) {
  //         issues = applyConstraints(output as InferObject<P, I, 'output'>, options, issues);
  //       }
  //       raiseIfIssues(issues);
  //       return output;
  //     };
  //
  //     if (options != null && options.fast) {
  //       resolve(Promise.all(promises).then(returnOutput));
  //     } else {
  //       resolve(Promise.allSettled(promises).then(createProcessSettled(issues, returnOutput)));
  //     }
  //   });
  // }
}
