import {
  createCatchForKey,
  isDict,
  isEqual,
  parseAsync,
  ParserContext,
  raiseIfIssues,
  raiseIssue,
  raiseOrCaptureIssuesForKey,
} from '../utils';
import { AnyShape, Shape } from './Shape';
import { Dict, InputConstraintOptionsOrMessage, INVALID, Issue, ParserOptions } from '../shared-types';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT } from './constants';

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

  parse(input: unknown, options?: ParserOptions): Record<K['output'], V['output']> {
    if (!isDict(input)) {
      raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this.options, MESSAGE_OBJECT_TYPE);
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

      try {
        outputKey = keyShape.parse(inputKey, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, inputKey);
      }
      try {
        outputValue = valueShape.parse(inputValue, options);
      } catch (error) {
        issues = raiseOrCaptureIssuesForKey(error, options, issues, inputKey);
      }

      if (output === input && inputKey === outputKey && isEqual(inputValue, outputValue)) {
        continue;
      }
      if (output === input) {
        output = sliceDict(input, keyIndex);
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
      if (!isDict(input)) {
        raiseIssue(input, CODE_TYPE, TYPE_OBJECT, this.options, MESSAGE_OBJECT_TYPE);
      }

      const { keyShape, valueShape, applyConstraints } = this;
      const context: ParserContext = { issues: null };
      const entryPromises = [];

      for (const key in input) {
        entryPromises.push(
          key,
          keyShape.parseAsync(key, options).catch(createCatchForKey(key, options, context)),
          valueShape.parseAsync(input[key], options).catch(createCatchForKey(key, options, context))
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

        if (applyConstraints !== null) {
          issues = applyConstraints(output as Record<K['output'], V['output']>, options, issues);
        }
        raiseIfIssues(issues);

        return output as Record<K['output'], V['output']>;
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
