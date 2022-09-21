import {
  captureIssuesForKey,
  createCatchForKey_OLD,
  isEqual,
  isObjectLike,
  parseAsync,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { ConstraintsProcessor, InputConstraintOptions, Issue, ObjectLike, ParserOptions } from '../shared-types';
import { INVALID, TYPE_CODE } from './issue-codes';

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
      raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
    }

    const { keyShape, valueShape, constraintsProcessor } = this;

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

    if (constraintsProcessor !== null) {
      issues = constraintsProcessor(input as Record<K['output'], V['output']>, options, issues);
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
        raiseIssue(input, TYPE_CODE, 'object', this._options, 'Must be an object');
      }

      const { keyShape, valueShape, constraintsProcessor } = this;

      const promises = [];
      const keys = Object.keys(input);
      const keysLength = keys.length;

      for (let i = 0; i < keysLength; ++i) {
        const key = keys[i];
        promises.push(keyShape.parseAsync(key, options), valueShape.parseAsync(input[key], options));
      }

      if (options !== undefined && options.fast) {
        for (let i = 0; i < keysLength; ++i) {
          promises[i] = promises[i].catch(createCatchForKey_OLD(keys[i]));
        }
        resolve(Promise.all(promises).then(createRecordResolver(keys, input, constraintsProcessor, options)));
        return;
      }

      resolve(
        Promise.allSettled(promises).then(createSettledRecordResolver(keys, input, constraintsProcessor, options))
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

function createRecordResolver(
  keys: string[],
  input: ObjectLike,
  constraintsProcessor: ConstraintsProcessor<any> | null,
  options: ParserOptions | undefined
): (entries: any[]) => any {
  return entries => {
    const keysLength = keys.length;

    let output = input;

    for (let i = 0, j = 0; i < keysLength; ++i, j += 2) {
      const inputKey = keys[i];
      const outputKey = entries[j];
      const outputValue = entries[j + 1];

      if (output === input && inputKey === outputKey && isEqual(input[inputKey], outputValue)) {
        continue;
      }
      if (output === input) {
        output = sliceObjectLike(input, i);
      }
      output[outputKey] = outputValue;
    }

    if (constraintsProcessor !== null) {
      constraintsProcessor(output, options, null);
    }
    return output;
  };
}

function createSettledRecordResolver(
  keys: string[],
  input: ObjectLike,
  constraintsProcessor: ConstraintsProcessor<any> | null,
  options: ParserOptions | undefined
): (results: PromiseSettledResult<any>[]) => any {
  return results => {
    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0, j = 0; i < keysLength; ++i, j += 2) {
      const inputKey = keys[i];

      const keyResult = results[j];
      const valueResult = results[j + 1];

      let outputKey = null;
      let outputValue = INVALID;

      let keyValid = true;

      if (keyResult.status === 'rejected') {
        issues = captureIssuesForKey(issues, keyResult.reason, inputKey);
        keyValid = false;
      } else {
        outputKey = keyResult.value;
      }

      if (valueResult.status === 'rejected') {
        issues = captureIssuesForKey(issues, valueResult.reason, inputKey);
      } else {
        outputValue = valueResult.value;

        if (keyValid && input === output && inputKey === outputKey && isEqual(outputValue, input[inputKey])) {
          continue;
        }
      }

      if (output === input) {
        output = sliceObjectLike(input, i);
      }
      if (keyValid) {
        output[outputKey] = outputValue;
      }
    }

    if (constraintsProcessor !== null) {
      issues = constraintsProcessor(output, options, issues);
    }
    raiseIfIssues(issues);

    return output;
  };
}
