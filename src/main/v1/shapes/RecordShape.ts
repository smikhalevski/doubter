import {
  cloneDictFirstKeys,
  createProcessSettled,
  createCatchForKey,
  isEqual,
  isObjectLike,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { InputConstraintOptions, Issue, ParserOptions } from '../shared-types';
import { TYPE_CODE } from './issue-codes';

export class RecordShape<K extends Shape<string>, V extends AnyShape> extends Shape<
  Record<K['input'], V['input']>,
  Record<K['output'], V['output']>
> {
  constructor(protected keyShape: K, protected valueShape: V, protected options?: InputConstraintOptions) {
    super(keyShape.async || valueShape.async);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' ? this.valueShape : null;
  }

  parse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> {
    if (!isObjectLike(input)) {
      raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
    }

    const { keyShape, valueShape, applyConstraints } = this;

    let issues: Issue[] | null = null;
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
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
      }
      try {
        outputValue = valueShape.parse(inputValue, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, key);
      }

      if ((output === input && key === outputKey && isEqual(inputValue, outputValue)) || issues !== null) {
        continue;
      }
      if (output === input) {
        output = cloneDictFirstKeys(input, keyIndex);
      }
      output[outputKey] = outputValue;
    }

    if (applyConstraints !== null) {
      issues = applyConstraints(input as Record<K['output'], V['output']>, options, issues);
    }
    raiseIfIssues(issues);

    return output as Record<K['output'], V['output']>;
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<Record<K['output'], V['output']>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, TYPE_CODE, 'object', this.options, 'Must be an object');
      }

      const { keyShape, valueShape, applyConstraints } = this;

      const results = [];

      const returnOutput = (entries: any[], issues: Issue[] | null = null): any => {
        let output = input;
        let keyIndex = 0;

        if (issues === null) {
          for (const key in input) {
            const outputKey = entries[keyIndex];
            const outputValue = entries[keyIndex + 1];

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

        if (applyConstraints !== null) {
          issues = applyConstraints(output as Record<K['output'], V['output']>, options, issues);
        }

        raiseIfIssues(issues);
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
        resolve(Promise.allSettled(results).then(createProcessSettled(null, returnOutput)));
      }
    });
  }
}
