import {
  createCatchForKey,
  isEqual,
  isObjectLike,
  IssuesContext,
  raiseIssue,
  returnOrRaiseIssues,
  safeParseAsync,
  throwOrCaptureIssuesForKey,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptionsOrMessage, INVALID, Issue, ParserOptions } from '../shared-types';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT } from './constants';
import { ValidationError } from '../ValidationError';

export class RecordShape<K extends Shape<string>, V extends AnyShape> extends Shape<
  Record<K['input'], V['input']>,
  Record<K['output'], V['output']>
> {
  constructor(readonly keyShape: K, readonly valueShape: V, protected options?: InputConstraintOptionsOrMessage) {
    super(keyShape.async || valueShape.async);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' ? this.valueShape : null;
  }

  safeParse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> | ValidationError {
    if (!isObjectLike(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this.options, MESSAGE_OBJECT_TYPE);
    }

    const { keyShape, valueShape, _applyConstraints } = this;

    let issues: Issue[] | null = null;
    let output = input;
    let keyIndex = 0;

    for (const inputKey in input) {
      ++keyIndex;

      const inputValue = input[inputKey];

      let outputKey: any = inputKey;
      let outputValue = INVALID;

      try {
        outputKey = keyShape.safeParse(inputKey, options);
      } catch (error) {
        issues = throwOrCaptureIssuesForKey(error, options, issues, inputKey);
      }
      try {
        outputValue = valueShape.safeParse(inputValue, options);
      } catch (error) {
        issues = throwOrCaptureIssuesForKey(error, options, issues, inputKey);
      }

      if (output === input && inputKey === outputKey && isEqual(inputValue, outputValue)) {
        continue;
      }
      if (output === input) {
        output = sliceDict(input, keyIndex);
      }
      output[outputKey] = outputValue;
    }

    if (_applyConstraints !== null) {
      issues = _applyConstraints(output as Record<K['output'], V['output']>, options, issues);
    }
    return returnOrRaiseIssues(output as Record<K['output'], V['output']>, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<Record<K['output'], V['output']> | ValidationError> {
    if (!this.async) {
      return safeParseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        return raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this.options, MESSAGE_OBJECT_TYPE);
      }

      const { keyShape, valueShape, _applyConstraints } = this;
      const context: IssuesContext = { issues: null };
      const entryPromises = [];

      for (const key in input) {
        entryPromises.push(
          key,
          keyShape.safeParseAsync(key, options).catch(createCatchForKey(key, options, context)),
          valueShape.safeParseAsync(input[key], options).catch(createCatchForKey(key, options, context))
        );
      }

      const promise = Promise.all(entryPromises).then(entries => {
        let output = input;

        for (let i = 0; i < entries.length; i += 3) {
          const inputKey = entries[i];
          const outputKey = entries[i + 1];
          const outputValue = entries[i + 2];

          if (output === input && inputKey === outputKey && isEqual(outputValue, input[inputKey])) {
            continue;
          }
          if (output === input) {
            output = sliceDict(input, i / 3);
          }
          output[outputKey] = outputValue;
        }

        let { issues } = context;

        if (_applyConstraints !== null) {
          issues = _applyConstraints(output as Record<K['output'], V['output']>, options, issues);
        }
        return returnOrRaiseIssues(output as Record<K['output'], V['output']>, issues);
      });

      resolve(promise);
    });
  }
}

function sliceDict(input: Dict, keyCount: number): Dict {
  const output: Dict = {};
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
