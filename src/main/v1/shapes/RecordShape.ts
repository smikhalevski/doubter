import {
  captureIssuesForKey,
  createCatchForKey,
  createCatchForKey_OLD,
  isEqual,
  isObjectLike,
  parseAsync,
  ParserContext,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { ApplyConstraints, InputConstraintOptions, INVALID, Issue, ObjectLike, ParserOptions } from '../shared-types';
import { CODE_TYPE } from './constants';

export class RecordShape<K extends Shape<string>, V extends AnyShape> extends Shape<
  Record<K['input'], V['input']>,
  Record<K['output'], V['output']>
> {
  constructor(readonly keyShape: K, readonly valueShape: V, private _options?: InputConstraintOptions) {
    super(keyShape.async || valueShape.async);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' ? this.valueShape : null;
  }

  parse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> {
    if (!isObjectLike(input)) {
      raiseIssue(input, CODE_TYPE, 'object', this._options, 'Must be an object');
    }

    const { keyShape, valueShape, applyConstraints } = this;

    let issues: Issue[] | null = null;
    let output = input;
    let keyIndex = 0;

    for (const inputKey in input) {
      ++keyIndex;

      const inputValue = input[inputKey];

      let outputKey = inputKey;
      let outputValue = INVALID;
      let keyValid = true;
      let valueValid = true;

      try {
        outputKey = keyShape.parse(inputKey, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, inputKey);
        keyValid = false;
        continue;
      }
      try {
        outputValue = valueShape.parse(inputValue, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, inputKey);
        valueValid = false;
      }

      if (!keyValid) {
        if (output === input) {
          output = sliceObjectLike(input, keyIndex);
        }
        continue;
      }
      if (valueValid && output === input && inputKey === outputKey && isEqual(inputValue, outputValue)) {
        continue;
      }
      if (output === input) {
        output = sliceObjectLike(input, keyIndex);
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
    if (!this.async) {
      return parseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        raiseIssue(input, CODE_TYPE, 'object', this._options, 'Must be an object');
      }

      const { keyShape, valueShape, applyConstraints } = this;

      const promises = [];
      const context: ParserContext = { issues: null };

      for (const key in input) {
        promises.push(
          key,
          keyShape.parseAsync(key, options).catch(createCatchForKey(key, options, context)),
          valueShape.parseAsync(input[key], options).catch(createCatchForKey(key, options, context))
        );
      }

      resolve(
        Promise.all(promises).then(entries => {
          let output = input;

          for (let i = 0; i < entries.length; i += 3) {
            const inputKey = entries[i];
            const outputKey = entries[i + 1];
            const outputValue = entries[i + 2];

            if (output === input && inputKey === outputKey && isEqual(outputValue, input[inputKey])) {
              continue;
            }
            if (output === input) {
              output = sliceObjectLike(input, i / 3);
            }
            output[outputKey] = outputValue;
          }

          let { issues } = context;

          if (applyConstraints !== null) {
            issues = applyConstraints(output as Record<K['output'], V['output']>, options, issues);
          }
          raiseIfIssues(issues);

          return output as Record<K['output'], V['output']>;
        })
      );
    });
  }
}

function sliceObjectLike(input: ObjectLike, keyCount: number): ObjectLike {
  const output: ObjectLike = {};
  let i = 0;

  for (const key in input) {
    if (i === keyCount) {
      break;
    }
    output[key] = input[key];
    i++;
  }
  return output;
}
