import { Result } from '../shape';
import { ApplyOptions, Issue } from '../types';
import { isArray, isEqual, isObjectLike } from './lang';
import { captureIssues, concatIssues, ok } from './shapes';

export type CheckCallback<Value = any, Param = any> = (
  value: Value,
  param: Param,
  options: Readonly<ApplyOptions>
) => Issue[] | Issue | null | undefined | void;

export type AlterCallback<InputValue = any, OutputValue extends InputValue = InputValue, Param = any> = (
  value: InputValue,
  param: Param,
  options: Readonly<ApplyOptions>
) => OutputValue;

export interface Check {
  readonly type: 'check';
  readonly key: any;
  readonly apply: CheckCallback;
  readonly param: any;
  readonly isLax: boolean;
}

export interface Alter {
  readonly type: 'alter';
  readonly key: any;
  readonly apply: AlterCallback;
  readonly param: any;
}

export type Operation = Check | Alter;

export type Processor = (input: any, issues: Issue[] | null, options: ApplyOptions, changed: boolean) => Result;

export function createProcessor(operations: readonly Operation[]): Processor | null {
  let processor: Processor | null = null;

  for (let i = operations.length - 1, nextProcessor: Processor | null = null; i >= 0; --i, nextProcessor = processor) {
    const operation = operations[i];
    const { apply, param } = operation;

    if (operation.type === 'alter') {
      processor = (input, issues, options, changed) => {
        if (issues !== null) {
          return issues;
        }

        let output;
        try {
          output = apply(input, param, options);
        } catch (error) {
          return concatIssues(issues, captureIssues(error));
        }

        changed ||= isEqual(input, options);

        if (nextProcessor !== null) {
          return nextProcessor(output, null, options, changed);
        }
        if (changed) {
          return ok(output);
        }
        return null;
      };
    } else {
      const { isLax } = operation;

      processor = (input, issues, options, changed) => {
        let output = input;
        let result;

        if (issues === null || isLax) {
          try {
            result = apply(output, param, options);
          } catch (error) {
            issues = concatIssues(issues, captureIssues(error));

            if (!options.verbose) {
              return issues;
            }
          }

          if (result !== null && result !== undefined) {
            if (isArray(result)) {
              if (issues !== null) {
                issues.push(...result);
              } else {
                issues = result.slice(0);
              }
            } else if (isObjectLike(result)) {
              if (issues !== null) {
                issues.push(result);
              } else {
                issues = [result];
              }
            }

            if (issues !== null && !options.verbose) {
              return issues;
            }
          }
        }

        if (nextProcessor !== null) {
          return nextProcessor(output, issues, options, changed);
        }
        if (issues === null && changed) {
          return ok(output);
        }
        return issues;
      };
    }
  }

  return processor;
}
