import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptions, Multiple, ParserOptions } from '../shared-types';
import {
  captureIssuesForKey,
  cloneObjectEnumerableKeys,
  cloneObjectKnownKeys,
  extractSettledValues,
  isAsync,
  isEqual,
  isObjectLike,
  raiseIssue,
  raiseOnError,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { ValidationError } from '../ValidationError';

type InferObjectShape<P extends Dict<AnyShape>, I extends AnyShape, V extends 'input' | 'output'> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][V] }> & (I extends Shape<never> ? unknown : { [indexer: string]: I[V] })
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

export class ObjectShape<P extends Dict<AnyShape>, I extends AnyShape> extends Shape<
  InferObjectShape<P, I, 'input'>,
  InferObjectShape<P, I, 'output'>
> {
  protected keys;
  protected valueShapes;
  protected keysMode;
  protected propEntries;
  protected exactOptions?: InputConstraintOptions;

  constructor(protected props: P, protected indexerShape: I | null, protected options?: InputConstraintOptions) {
    const valueShapes = Object.values(props);

    super(indexerShape?.async || isAsync(valueShapes));

    this.keys = Object.keys(props);
    this.valueShapes = valueShapes;
    this.propEntries = Object.entries(props);
    this.keysMode = indexerShape === null ? ObjectKeysMode.PRESERVE : ObjectKeysMode.INDEXER;
  }

  at(key: unknown): AnyShape | null {
    if (typeof key !== 'string') {
      return null;
    }
    if (this.keys.includes(key)) {
      return this.props[key];
    }
    return this.indexerShape;
  }

  extend<P1 extends Dict<AnyShape>>(
    shape: ObjectShape<P1, AnyShape>
  ): ObjectShape<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend<P1 extends Dict<AnyShape>>(props: P1): ObjectShape<Pick<P, Exclude<keyof P, keyof P1>> & P1, I>;

  extend(arg: ObjectShape<any, AnyShape> | Dict<AnyShape>): ObjectShape<any, I> {
    const nextProps = Object.assign({}, this.props, arg instanceof ObjectShape ? arg.props : arg);

    const shape = new ObjectShape<any, I>(nextProps, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  pick<K extends Multiple<keyof P & string>>(...keys: K): ObjectShape<Pick<P, K[number]>, I> {
    const nextProps: Dict<AnyShape> = {};

    for (const key of keys) {
      nextProps[key] = this.props[key];
    }
    const shape = new ObjectShape<any, I>(nextProps, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  omit<K extends Multiple<keyof P & string>>(...keys2: K): ObjectShape<Omit<P, K[number]>, I> {
    const { keys } = this;
    const nextProps: Dict<AnyShape> = {};

    for (let i = 0; i < keys.length; ++i) {
      if (!keys2.includes(keys[i])) {
        nextProps[keys[i]] = this.valueShapes[i];
      }
    }

    const shape = new ObjectShape<any, I>(nextProps, this.indexerShape);
    shape.keysMode = this.keysMode;
    return shape;
  }

  exact(options?: InputConstraintOptions): ObjectShape<P, Shape<never>> {
    const shape = this.clone() as any;
    shape.keysMode = ObjectKeysMode.EXACT;
    shape.exactOptions = options;
    shape.indexerShape = null;
    return shape;
  }

  strip(): ObjectShape<P, Shape<never>> {
    const shape = this.clone() as any;
    shape.keysMode = ObjectKeysMode.STRIP;
    shape.indexerShape = null;
    return shape;
  }

  preserve(): ObjectShape<P, Shape<any>> {
    const shape = this.clone() as any;
    shape.keysMode = ObjectKeysMode.PRESERVE;
    shape.indexerShape = null;
    return shape;
  }

  index<I1 extends AnyShape>(indexShape: I1): ObjectShape<P, I1> {
    const shape = this.clone() as any;
    shape.keysMode = ObjectKeysMode.INDEXER;
    shape.indexerShape = indexShape;
    return shape;
  }

  parse(input: unknown, options?: ParserOptions): InferObjectShape<P, I, 'output'> {
    if (!isObjectLike(input)) {
      raiseIssue(input, 'type', 'object', this.options, 'Must be an object');
    }
    const { propEntries, keysMode, keys, indexerShape } = this;

    let output = input;
    let rootError: ValidationError | null = null;

    if (keysMode === ObjectKeysMode.EXACT || keysMode === ObjectKeysMode.STRIP) {
      for (const key in input) {
        if (keys.includes(key)) {
          continue;
        }

        if (keysMode === ObjectKeysMode.EXACT) {
          // issues = raiseIssuesOrPush(
          //   issues,
          //   options,
          //   input,
          //   'unknownKeys',
          //   key,
          //   this.exactOptions,
          //   'Must have known keys but found ' + key
          // );
        }
        if (output === input) {
          output = cloneObjectKnownKeys(input, keys);
        }
      }
    }

    for (const [key, shape] of propEntries) {
      const value = input[key];

      let outputValue;
      try {
        outputValue = shape.parse(value, options);
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
      }
      if (isEqual(outputValue, value) || rootError !== null) {
        continue;
      }
      if (output === input) {
        output = cloneObjectEnumerableKeys(input);
      }
      output[key] = outputValue;
    }

    if (keysMode === ObjectKeysMode.INDEXER) {
      for (const key in input) {
        if (keys.includes(key)) {
          continue;
        }

        const value = input[key];

        let outputValue;
        try {
          outputValue = indexerShape!.parse(value, options);
        } catch (error) {
          rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
        }
        if (isEqual(outputValue, value) || rootError !== null) {
          continue;
        }
        if (output === input) {
          output = cloneObjectEnumerableKeys(input);
        }
        output[key] = outputValue;
      }
    }

    raiseOnError(rootError);

    return output as any;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<InferObjectShape<P, I, 'output'>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, 'type', 'object', this.options, 'Must be an object');
      }
      const promises = [];

      const { propEntries, keysMode, keys, indexerShape } = this;

      let objectKeys = keys;

      let output = input;

      const handleResults = (results: any): any => {
        for (let i = 0; i < objectKeys.length; ++i) {
          const key = objectKeys[i];
          const outputValue = results[i];

          if (isEqual(outputValue, input[key])) {
            continue;
          }
          if (output === input) {
            output = cloneObjectEnumerableKeys(input);
          }
          output[key] = outputValue;
        }
        return output;
      };

      for (const [key, shape] of propEntries) {
        promises.push(shape.parseAsync(input[key], options).catch(captureIssuesForKey(key)));
      }

      if (keysMode === ObjectKeysMode.INDEXER) {
        for (const key in input) {
          if (keys.includes(key)) {
            continue;
          }
          if (objectKeys === keys) {
            objectKeys = keys.slice(0);
          }
          objectKeys.push(key);
          promises.push(indexerShape!.parseAsync(input[key], options).catch(captureIssuesForKey(key)));
        }
      }

      if (options != null && options.fast) {
        resolve(Promise.all(promises).then(handleResults));
      } else {
        resolve(Promise.allSettled(promises).then(extractSettledValues(null)).then(handleResults));
      }
    });
  }
}
