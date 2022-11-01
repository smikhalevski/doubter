import {
  applySafeParseAsync,
  captureIssuesForKey,
  isEarlyReturn,
  raiseIssue,
  returnValueOrRaiseIssues,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptionsOrMessage, INVALID, Issue, ParserOptions } from '../shared-types';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT } from '../v3/shapes/constants';
import { isValidationError, ValidationError } from '../ValidationError';
import { isEqual, isObjectLike } from '../lang-utils';

export class RecordShape<K extends Shape<string>, V extends AnyShape> extends Shape<
  Record<K['input'], V['input']>,
  Record<K['output'], V['output']>
> {
  constructor(readonly keyShape: K, readonly valueShape: V, protected _options?: InputConstraintOptionsOrMessage) {
    super(keyShape.async || valueShape.async);
  }

  at(key: unknown): AnyShape | null {
    return typeof key === 'string' ? this.valueShape : null;
  }

  safeParse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> | ValidationError {
    if (!isObjectLike(input)) {
      return raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this._options, MESSAGE_OBJECT_TYPE);
    }

    const { keyShape, valueShape, _applyConstraints } = this;

    let issues: Issue[] | null = null;
    let output = input;
    let keyIndex = 0;

    for (const inputKey in input) {
      ++keyIndex;

      const inputValue = input[inputKey];

      let outputKey = keyShape.safeParse(inputKey, options);
      let outputValue = valueShape.safeParse(inputValue, options);

      if (output === input && inputKey === outputKey && isEqual(inputValue, outputValue)) {
        continue;
      }

      if (isValidationError(outputKey)) {
        issues = captureIssuesForKey(outputKey, options, issues, inputKey);

        if (isEarlyReturn(options)) {
          return outputKey;
        }
        outputKey = inputKey;
      }

      if (isValidationError(outputValue)) {
        issues = captureIssuesForKey(outputValue, options, issues, inputKey);

        if (isEarlyReturn(options)) {
          return outputValue;
        }
        outputValue = INVALID;
      }

      if (output === input) {
        output = sliceDict(input, keyIndex);
      }
      output[outputKey] = outputValue;
    }

    if (_applyConstraints !== null) {
      issues = _applyConstraints(output, options, issues);
    }
    return returnValueOrRaiseIssues(output as Record<K['output'], V['output']>, issues);
  }

  safeParseAsync(input: unknown, options?: ParserOptions): Promise<Record<K['output'], V['output']> | ValidationError> {
    if (!this.async) {
      return applySafeParseAsync(this, input, options);
    }

    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        resolve(raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this._options, MESSAGE_OBJECT_TYPE));
        return;
      }

      const { keyShape, valueShape, _applyConstraints } = this;
      const entryPromises = [];

      for (const key in input) {
        entryPromises.push(key, keyShape.safeParseAsync(key, options), valueShape.safeParseAsync(input[key], options));
      }

      const promise = Promise.all(entryPromises).then(entries => {
        let issues: Issue[] | null = null;
        let output = input;

        for (let i = 0; i < entries.length; i += 3) {
          const inputKey = entries[i];

          let outputKey = entries[i + 1];
          let outputValue = entries[i + 2];

          if (output === input && inputKey === outputKey && isEqual(outputValue, input[inputKey])) {
            continue;
          }

          if (isValidationError(outputKey)) {
            issues = captureIssuesForKey(outputKey, options, issues, inputKey);

            if (isEarlyReturn(options)) {
              return outputKey;
            }
            outputKey = inputKey;
          }

          if (isValidationError(outputValue)) {
            issues = captureIssuesForKey(outputValue, options, issues, inputKey);

            if (isEarlyReturn(options)) {
              return outputValue;
            }
            outputValue = INVALID;
          }

          if (output === input) {
            output = sliceDict(input, i / 3);
          }
          output[outputKey] = outputValue;
        }

        if (_applyConstraints !== null) {
          issues = _applyConstraints(output, options, issues);
        }
        return returnValueOrRaiseIssues(output as Record<K['output'], V['output']>, issues);
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
