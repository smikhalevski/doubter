import { AnyType, InferType, Type } from './Type';
import {
  copyObjectEnumerableKeys,
  createCatchForKey,
  createValuesExtractor,
  isEqual,
  isFast,
  isObjectLike,
  parseAsync,
  promiseAll,
  promiseAllSettled,
  raiseIssue,
  raiseIssuesIfDefined,
  raiseIssuesOrCaptureForKey,
} from '../utils';
import { Awaitable, ConstraintOptions, ParserOptions } from '../shared-types';

export class RecordType<K extends Type<string>, V extends AnyType> extends Type<Record<InferType<K>, InferType<V>>> {
  constructor(protected keyType: K, protected valueType: V, options?: ConstraintOptions) {
    super(keyType.async || valueType.async, options);
  }

  at(key: unknown): AnyType | null {
    return typeof key === 'string' ? this.valueType : null;
  }

  parse(input: unknown, options?: ParserOptions): Awaitable<Record<InferType<K>, InferType<V>>> {
    if (!isObjectLike(input)) {
      raiseIssue(input, 'type', 'object', this.options, 'Must be an object');
    }

    const { keyType, valueType } = this;

    if (this.async) {
      const results = [];

      const handleResults = (results: any[]): any => {
        let output = input;
        let i = 0;

        for (const key in input) {
          const outputKey = results[i];
          const outputValue = results[i + 1];

          if (key === outputKey && isEqual(input[key], outputValue) && output === input) {
            continue;
          }
          if (output === input) {
            output = copyObjectEnumerableKeys(input, i);
          }
          output[outputKey] = outputValue;

          i += 2;
        }

        return output;
      };

      for (const key in input) {
        results.push(
          parseAsync(keyType, key, options).catch(createCatchForKey(key)),
          parseAsync(valueType, input[key], options).catch(createCatchForKey(key))
        );
      }

      if (isFast(options)) {
        return promiseAll(results).then(handleResults);
      }
      return promiseAllSettled(results).then(createValuesExtractor()).then(handleResults);
    }

    let output = input;
    let issues;
    let i = 0;

    for (const key in input) {
      ++i;
      const value = input[key];

      let outputKey = key;
      let outputValue;

      try {
        outputKey = keyType.parse(key, options) as string;
      } catch (error) {
        issues = raiseIssuesOrCaptureForKey(error, issues, options, key);
      }
      try {
        outputValue = valueType.parse(value, options);
      } catch (error) {
        issues = raiseIssuesOrCaptureForKey(error, issues, options, key);
      }

      if ((key === outputKey && isEqual(value, outputValue) && output === input) || issues !== undefined) {
        continue;
      }
      if (output === input) {
        output = copyObjectEnumerableKeys(input, i);
      }
      output[outputKey] = outputValue;
    }

    raiseIssuesIfDefined(issues);

    return output as Record<InferType<K>, InferType<V>>;
  }
}
