import {
  applyConstraints,
  cloneDictFirstKeys,
  createCatchClauseForKey,
  createOutputExtractor,
  isEqual,
  isObjectLike,
  raiseIssue,
  raiseOnError,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, ParserOptions } from '../shared-types';
import { ValidationError } from '../ValidationError';
import { TYPE_CODE } from './issue-codes';

export class RecordShape<K extends Shape<string>, V extends AnyShape> extends Shape<
  Record<K['input'], V['input']>,
  Record<K['output'], V['output']>
> {
  constructor(protected keyShape: K, protected valueShape: V, protected options?: InputConstraintOptions) {
    super(keyShape.async || valueShape.async);
  }

  at(propertyName: unknown): AnyShape | null {
    return typeof propertyName === 'string' ? this.valueShape : null;
  }

  parse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
    }

    const { keyShape, valueShape, constraints } = this;

    let rootError: ValidationError | null = null;
    let output = input;
    let keyIndex = 0;

    for (const key in input) {
      ++keyIndex;
      const inputValue = input[key];

      let outputKey = key;
      let outputValue;

      try {
        outputKey = keyShape.parse(key, options);
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
      }
      try {
        outputValue = valueShape.parse(inputValue, options);
      } catch (error) {
        rootError = raiseOrCaptureIssuesForKey(error, rootError, options, key);
      }

      if ((output === input && key === outputKey && isEqual(inputValue, outputValue)) || rootError !== null) {
        continue;
      }
      if (output === input) {
        output = cloneDictFirstKeys(input, keyIndex);
      }
      output[outputKey] = outputValue;
    }

    if (constraints !== null) {
      rootError = applyConstraints(input, constraints, options, rootError);
    }
    raiseOnError(rootError);

    return output as Record<K['output'], V['output']>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<Record<K['output'], V['output']>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
      }

      const { keyShape, valueShape, constraints } = this;

      const results = [];

      const returnOutput = (results: any[], rootError: ValidationError | null = null): any => {
        let output = input;
        let keyIndex = 0;

        if (rootError === null) {
          for (const key in input) {
            const outputKey = results[keyIndex];
            const outputValue = results[keyIndex + 1];

            if (output === input && key === outputKey && isEqual(input[key], outputValue)) {
              continue;
            }
            if (output === input) {
              output = cloneDictFirstKeys(input, keyIndex);
            }
            output[outputKey] = outputValue;

            keyIndex += 2;
          }
        }

        if (constraints !== null) {
          rootError = applyConstraints(output, constraints, options, rootError);
        }

        raiseOnError(rootError);
        return output;
      };

      for (const key in input) {
        results.push(
          keyShape.parseAsync(key, options).catch(createCatchClauseForKey(key)),
          valueShape.parseAsync(input[key], options).catch(createCatchClauseForKey(key))
        );
      }

      if (options != null && options.fast) {
        resolve(Promise.all(results).then(returnOutput));
      } else {
        resolve(Promise.allSettled(results).then(createOutputExtractor(null, returnOutput)));
      }
    });
  }
}
