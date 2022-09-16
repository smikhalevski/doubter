import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptions, Issue, Multiple, ParserOptions } from '../shared-types';
import {
  cloneDict,
  createCatchForKey,
  createOutputExtractor,
  isAsync,
  isEqual,
  isObjectLike,
  raiseIssue,
  raiseOnIssues,
  raiseOrCaptureIssues,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { TYPE_CODE } from './issue-codes';

type InferObject<P extends Dict<AnyShape>, I extends AnyShape | null, X extends 'input' | 'output'> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][X] }> & (I extends AnyShape ? { [indexer: string]: I[X] } : unknown)
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

export class ObjectShape<P extends Dict<AnyShape>, I extends AnyShape | null> extends Shape<
  InferObject<P, I, 'input'>,
  InferObject<P, I, 'output'>
> {
  protected keys;
  protected keysMode;
  protected valueShapes;
  protected entries: any[];
  protected unknownKeyOptions?: InputConstraintOptions;
  protected missingKeyOptions?: InputConstraintOptions;

  protected applyKeysConstraint: (() => Dict) | null = null;

  constructor(protected propShapes: P, protected indexerShape: I | null, protected options?: InputConstraintOptions) {
    const valueShapes = Object.values(propShapes);

    super(indexerShape?.async || isAsync(valueShapes));

    this.keys = Object.keys(propShapes);
    this.keysMode = indexerShape !== null ? ObjectKeysMode.INDEXER : ObjectKeysMode.PRESERVE;
    this.valueShapes = valueShapes;

    this.entries = [];

    for (const [key, value] of Object.entries(propShapes)) {
      this.entries.push(key, value);
    }
  }

  at(key: unknown): AnyShape | null {
    if (typeof key !== 'string') {
      return null;
    }
    if (this.keys.includes(key)) {
      return this.propShapes[key];
    }
    return this.indexerShape;
  }

  extend<P1 extends Dict<AnyShape>>(
    shape: ObjectShape<P1, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend<P1 extends Dict<AnyShape>>(props: P1): ObjectShape<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend(shapeOrProps: ObjectShape<any, AnyShape> | Dict<AnyShape>): ObjectShape<any, I> {
    const propShapes = Object.assign(
      {},
      this.propShapes,
      shapeOrProps instanceof ObjectShape ? shapeOrProps.propShapes : shapeOrProps
    );

    const shape = new ObjectShape<any, I>(propShapes, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  pick<K extends Multiple<keyof P & string>>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const knownKeys = this.keys;
    const propShapes: Dict<AnyShape> = {};

    for (let i = 0; i < knownKeys.length; ++i) {
      if (keys.includes(knownKeys[i])) {
        propShapes[knownKeys[i]] = this.valueShapes[i];
      }
    }

    const shape = new ObjectShape<any, I>(propShapes, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  omit<K extends Multiple<keyof P & string>>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const knownKeys = this.keys;
    const propShapes: Dict<AnyShape> = {};

    for (let i = 0; i < knownKeys.length; ++i) {
      if (!keys.includes(knownKeys[i])) {
        propShapes[knownKeys[i]] = this.valueShapes[i];
      }
    }

    const shape = new ObjectShape<any, I>(propShapes, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  exact(unknownKeyOptions?: InputConstraintOptions, missingKeyOptions?: InputConstraintOptions): ObjectShape<P, null> {
    const shape = this.clone();
    shape.keysMode = ObjectKeysMode.EXACT;
    shape.unknownKeyOptions = unknownKeyOptions;
    shape.missingKeyOptions = missingKeyOptions;
    shape.indexerShape = null;
    return shape as ObjectShape<P, null>;
  }

  strip(): ObjectShape<P, null> {
    const shape = this.clone();
    shape.keysMode = ObjectKeysMode.STRIP;
    shape.indexerShape = null;
    return shape as ObjectShape<P, null>;
  }

  preserve(): ObjectShape<P, Shape<any>> {
    const shape = this.clone();
    shape.keysMode = ObjectKeysMode.PRESERVE;
    shape.indexerShape = null;
    return shape as ObjectShape<P, Shape<any>>;
  }

  index<T extends AnyShape>(indexerShape: T): ObjectShape<P, T> {
    const shape = this.clone() as ObjectShape<P, T>;
    shape.keysMode = ObjectKeysMode.INDEXER;
    shape.indexerShape = indexerShape;
    return shape;
  }

  parse(input: unknown, options?: ParserOptions): InferObject<P, I, 'output'> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
    }

    const { entries, applyConstraints, applyKeysConstraint } = this;
    const entriesLength = entries.length;

    let issues: Issue[] | null = null;
    let output = input;

    if (applyKeysConstraint !== null) {
      try {
        output = applyKeysConstraint();
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, issues);
      }
    }

    // if (keysMode !== ObjectKeysMode.PRESERVE) {
    //   if (keysMode === ObjectKeysMode.STRIP) {
    //     for (const key in input) {
    //       if (!keys.includes(key)) {
    //         output = pickDictKeys(input, keys);
    //         break;
    //       }
    //     }
    //   } else if (keysMode === ObjectKeysMode.EXACT) {
    //     let knownKeyCount = 0;
    //
    //     for (const key in input) {
    //       if (keys.includes(key)) {
    //         ++knownKeyCount;
    //         continue;
    //       }
    //       rootError = raiseOrCaptureIssues(
    //         createError(input, UNKNOWN_KEY, key, this.unknownKeyOptions, 'Must not contain unknown keys'),
    //         rootError,
    //         options
    //       );
    //     }
    //     if (knownKeyCount !== keys.length) {
    //       rootError = raiseOrCaptureIssues(
    //         createError(input, MISSING_KEY, null, this.missingKeyOptions, 'Must not have missing keys'),
    //         rootError,
    //         options
    //       );
    //     }
    //   } else {
    //     for (const key in input) {
    //       if (keys.includes(key)) {
    //         continue;
    //       }
    //
    //       const inputValue = input[key];
    //
    //       let outputValue;
    //       try {
    //         outputValue = indexerShape!.parse(inputValue, options);
    //       } catch (error) {
    //         rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
    //         output = input;
    //       }
    //       if (isEqual(outputValue, inputValue) || rootError !== null) {
    //         continue;
    //       }
    //       if (output === input) {
    //         output = cloneDict(input);
    //       }
    //       output[key] = outputValue;
    //     }
    //   }
    // }

    for (let i = 0; i < entriesLength; i += 2) {
      const key = entries[i];
      const inputValue = input[key];

      let outputValue;
      try {
        outputValue = entries[i + 1].parse(inputValue, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
        output = input;
      }
      if (isEqual(outputValue, inputValue) || issues !== null) {
        continue;
      }
      if (output === input) {
        output = cloneDict(input);
      }
      output[key] = outputValue;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output as InferObject<P, I, 'output'>, options, issues);
    }
    raiseOnIssues(issues);

    return output as InferObject<P, I, 'output'>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferObject<P, I, 'output'>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
      }
      const { entries, applyConstraints, applyKeysConstraint } = this;
      const entriesLength = entries.length;

      let issues: Issue[] | null = null;
      let output = input;

      if (applyKeysConstraint !== null) {
        try {
          output = applyKeysConstraint();
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }

      const promises = [];

      for (let i = 0; i < entriesLength; i += 2) {
        const key = entries[i];
        promises.push(key, entries[i + 1].parseAsync(input[key], options).catch(createCatchForKey(key)));
      }

      // if (indexerShape !== null) {
      //   for (const key in input) {
      //     if (keys.includes(key)) {
      //       continue;
      //     }
      //     promises.push(key, indexerShape.parseAsync(input[key], options).catch(createCatchClauseForKey(key)));
      //   }
      // }

      const returnOutput = (entries: any[], issues: Issue[] | null = null): any => {
        if (issues !== null) {
          output = input;
        } else {
          const entriesLength = entries.length;

          for (let i = 0; i < entriesLength; i += 2) {
            const key = entries[i];
            const outputValue = entries[i + 1];

            if (isEqual(outputValue, input[key])) {
              continue;
            }
            if (output === input) {
              output = cloneDict(input);
            }
            output[key] = outputValue;
          }
        }

        if (applyConstraints !== null) {
          issues = applyConstraints(output as InferObject<P, I, 'output'>, options, issues);
        }
        raiseOnIssues(issues);
        return output;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(promises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(promises).then(createOutputExtractor(issues, returnOutput)));
      }
    });
  }
}
