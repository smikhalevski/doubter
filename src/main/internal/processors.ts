import { Result } from '../shape';
import { ApplyOptions, CheckCallback, Issue } from '../types';
import { isArray, isEqual, isObjectLike } from './lang';
import { captureIssues, concatIssues, ok } from './shapes';

export type AlterCallback<InputValue = any, OutputValue extends InputValue = InputValue, Param = any> = (
  value: InputValue,
  param: Param,
  options: Readonly<ApplyOptions>
) => OutputValue;

/**
 * @param output The shape output value.
 * @param options Parsing options.
 * @return `true` if value matches the predicate, or `false` otherwise.
 * @throws {@linkcode ValidationError} to notify that the refinement cannot be completed.
 */
export type RefineCallback<Value> = (value: Value, options: Readonly<ApplyOptions>) => boolean;

/**
 * @param output The shape output value.
 * @param options Parsing options.
 * @return `true` if value matches the predicate, or `false` otherwise.
 * @throws {@linkcode ValidationError} to notify that the refinement cannot be completed.
 */
export type RefinePredicate<InputValue, OutputValue extends InputValue> = (
  value: InputValue,
  options: Readonly<ApplyOptions>
) => value is OutputValue;

export interface AlterOptions {
  key?: unknown;
  param?: any;
}

export interface CheckOperation {
  readonly type: 'check';
  readonly key: any;
  readonly apply: CheckCallback;
  readonly param: any;
  readonly isUnsafe: boolean;
}

export interface AlterOperation {
  readonly type: 'alter';
  readonly key: any;
  readonly apply: AlterCallback;
  readonly param: any;
}

export type Operation = CheckOperation | AlterOperation;

export type Processor = (input: any, issues: Issue[] | null, options: ApplyOptions, changed: boolean) => Result;

/**
 * Composes a processor that applies operations sequentially.
 *
 * @param operations The array of operation the processor should apply.
 */
export function createProcessor(operations: readonly Operation[]): Processor | null {
  let processor: Processor | null = null;

  for (let i = operations.length - 1, next: Processor | null = null; i >= 0; --i, next = processor) {
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

        changed = changed || !isEqual(input, output);

        if (next !== null) {
          return next(output, null, options, changed);
        }
        if (changed) {
          return ok(output);
        }
        return null;
      };
    }

    if (operation.type === 'check') {
      const { isUnsafe } = operation;

      processor = (input, issues, options, changed) => {
        let output = input;

        if (isUnsafe || issues === null) {
          try {
            const result = apply(output, param, options);

            if (isObjectLike(result)) {
              if (issues !== null) {
                if (isArray(result)) {
                  issues.push(...result);
                } else {
                  issues.push(result);
                }
              } else {
                issues = isArray(result) ? result.slice(0) : [result];
              }
              if (!options.verbose) {
                return issues;
              }
            }
          } catch (error) {
            issues = concatIssues(issues, captureIssues(error));

            if (!options.verbose) {
              return issues;
            }
          }
        }
        if (next !== null) {
          return next(output, issues, options, changed);
        }
        if (changed && issues === null) {
          return ok(output);
        }
        return issues;
      };
    }
  }

  return processor;
}
