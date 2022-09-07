import {
  copyObjectEnumerableKeys,
  createCatchForKey,
  createExtractor,
  isEqual,
  isObjectLike,
  raiseError,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from './utils';
import { AnyShape, Shape } from './Shape';
import { ConstraintOptions, ParserOptions } from './shared-types';
import { ValidationError } from '../ValidationError';

export class RecordShape<K extends Shape<string>, V extends AnyShape> extends Shape<
  Record<K['input'], V['input']>,
  Record<K['output'], V['output']>
> {
  constructor(protected keyShape: K, protected valueShape: V, protected options?: ConstraintOptions) {
    super(keyShape.async || valueShape.async);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' ? this.valueShape : null;
  }

  parse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> {
    if (!isObjectLike(input)) {
      raiseIssue(input, 'type', 'object', this.options, 'Must be an object');
    }

    const { keyShape, valueShape } = this;

    let rootError: ValidationError | null = null;
    let output = input;
    let i = 0;

    for (const key in input) {
      ++i;
      const inputValue = input[key];

      let outputKey = key;
      let outputValue;

      try {
        outputKey = keyShape.parse(key, options) as string;
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
      }
      try {
        outputValue = valueShape.parse(inputValue, options);
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
      }

      if ((key === outputKey && isEqual(inputValue, outputValue) && output === input) || rootError !== null) {
        continue;
      }
      if (output === input) {
        output = copyObjectEnumerableKeys(input, i);
      }
      output[outputKey] = outputValue;
    }

    raiseError(rootError);

    return output as Record<K['output'], V['output']>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<Record<K['output'], V['output']>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, 'type', 'object', this.options, 'Must be an object');
      }

      const { keyShape, valueShape } = this;

      const results = [];

      const returnOutput = (results: any[]): any => {
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
          keyShape.parseAsync(key, options).catch(createCatchForKey(key)),
          valueShape.parseAsync(input[key], options).catch(createCatchForKey(key))
        );
      }

      if (options != null && options.fast) {
        resolve(Promise.all(results).then(returnOutput));
      } else {
        resolve(Promise.allSettled(results).then(createExtractor(null)).then(returnOutput));
      }
    });
  }
}
