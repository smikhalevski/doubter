import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptions, Issue, Multiple, ParserOptions } from '../shared-types';
import {
  cloneDict,
  createCatchForKey,
  createProcessSettled,
  isAsync,
  isEqual,
  isObjectLike,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssues,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { INVALID, TYPE_CODE } from './issue-codes';

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
  protected entries: any[];
  protected keys: string[];
  protected keysMode;
  protected exactOptions?: InputConstraintOptions;
  protected processKeys: ProcessKeys | null = null;

  constructor(protected propShapes: P, protected indexerShape: I | null, protected options?: InputConstraintOptions) {
    super(indexerShape?.async || isAsync(Object.values(propShapes)));

    this.keys = Object.keys(this.propShapes);
    this.keysMode = indexerShape !== null ? ObjectKeysMode.INDEXER : ObjectKeysMode.PRESERVE;

    this.entries = [];

    for (const [key, value] of Object.entries(propShapes)) {
      this.entries.push(key, value);
    }
  }

  at(key: unknown): AnyShape | null {
    if (typeof key !== 'string') {
      return null;
    }
    if (key in this.propShapes) {
      return this.propShapes[key];
    }
    return this.indexerShape;
  }

  extend<P1 extends Dict<AnyShape>>(
    shape: ObjectShape<P1, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend<P1 extends Dict<AnyShape>>(props: P1): ObjectShape<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend(props: ObjectShape<any, AnyShape> | Dict<AnyShape>): ObjectShape<any, I> {
    const propShapes = Object.assign({}, this.propShapes, props instanceof ObjectShape ? props.propShapes : props);

    const shape = new ObjectShape<any, I>(propShapes, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  pick<K extends Multiple<keyof P & string>>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const propShapes: Dict<AnyShape> = {};

    for (const [key, value] of Object.entries(this.propShapes)) {
      if (keys.includes(key)) {
        propShapes[key] = value;
      }
    }

    const shape = new ObjectShape<any, I>(propShapes, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  omit<K extends Multiple<keyof P & string>>(...keys: K): ObjectShape<Omit<P, K[number]>, I> {
    const propShapes: Dict<AnyShape> = {};

    for (const [key, value] of Object.entries(this.propShapes)) {
      if (!keys.includes(key)) {
        propShapes[key] = value;
      }
    }

    const shape = new ObjectShape<any, I>(propShapes, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  exact(options?: InputConstraintOptions): ObjectShape<P, null> {
    const shape = this.clone();
    shape.keysMode = ObjectKeysMode.EXACT;
    shape.exactOptions = options;
    shape.processKeys = createProcessExactKeys(this.keys, options);
    shape.indexerShape = null;
    return shape as ObjectShape<P, null>;
  }

  strip(): ObjectShape<P, null> {
    const shape = this.clone();
    shape.keysMode = ObjectKeysMode.STRIP;
    shape.exactOptions = undefined;
    shape.processKeys = createProcessStripKeys(this.keys);
    shape.indexerShape = null;
    return shape as ObjectShape<P, null>;
  }

  preserve(): ObjectShape<P, Shape<any>> {
    const shape = this.clone();
    shape.keysMode = ObjectKeysMode.PRESERVE;
    shape.exactOptions = undefined;
    shape.processKeys = null;
    shape.indexerShape = null;
    return shape as ObjectShape<P, Shape<any>>;
  }

  index<T extends AnyShape>(indexerShape: T): ObjectShape<P, T> {
    const shape = this.clone() as ObjectShape<P, T>;
    shape.keysMode = ObjectKeysMode.INDEXER;
    shape.exactOptions = undefined;
    shape.processKeys = null;
    shape.indexerShape = indexerShape;
    return shape;
  }

  parse(input: unknown, options?: ParserOptions): InferObject<P, I, 'output'> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
    }

    const { entries, applyConstraints, processKeys, indexerShape } = this;
    const entriesLength = entries.length;

    let issues: Issue[] | null = null;
    let output = input;

    if (processKeys !== null) {
      try {
        output = processKeys(input);
      } catch (error) {
        issues = raiseOrCaptureIssues(error, options, issues);
      }
    }

    for (let i = 0; i < entriesLength; i += 2) {
      const key = entries[i];
      const inputValue = input[key];

      let parsed = true;
      let outputValue = INVALID;
      try {
        outputValue = entries[i + 1].parse(inputValue, options);
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

    if (indexerShape !== null) {
      const { keys } = this;

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
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(output as InferObject<P, I, 'output'>, options, issues);
    }
    raiseIfIssues(issues);

    return output as InferObject<P, I, 'output'>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferObject<P, I, 'output'>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
      }
      const { entries, applyConstraints, processKeys } = this;
      const entriesLength = entries.length;

      let issues: Issue[] | null = null;
      let output = input;

      if (processKeys !== null) {
        try {
          output = processKeys(input);
        } catch (error) {
          issues = raiseOrCaptureIssues(error, options, issues);
        }
      }

      const promises = [];

      for (let i = 0; i < entriesLength; i += 2) {
        const key = entries[i];
        promises.push(key, entries[i + 1].parseAsync(input[key], options).catch(createCatchForKey(key)));
      }

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
        raiseIfIssues(issues);
        return output;
      };

      if (options != null && options.fast) {
        resolve(Promise.all(promises).then(returnOutput));
      } else {
        resolve(Promise.allSettled(promises).then(createProcessSettled(issues, returnOutput)));
      }
    });
  }
}

type ProcessKeys = (input: Dict) => Dict;

function createProcessExactKeys(keys: string[], options: InputConstraintOptions | string | undefined): ProcessKeys {
  const keysLength = keys.length;

  return input => {
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
}

function createProcessStripKeys(keys: string[]): ProcessKeys {
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
