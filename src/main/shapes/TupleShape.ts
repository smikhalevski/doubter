import { AnyShape, Shape } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, Tuple, TypeConstraintOptions } from '../shared-types';
import {
  concatIssues,
  createCheckConfig,
  isAsyncShapes,
  isTupleIndex,
  ok,
  raiseIssue,
  unshiftPath,
} from '../shape-utils';
import { CODE_TUPLE, MESSAGE_TUPLE } from './constants';
import { isArray, isEqual } from '../lang-utils';

export type InferTuple<U extends Tuple<AnyShape>, C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] };

export class TupleShape<U extends Tuple<AnyShape>> extends Shape<InferTuple<U, 'input'>, InferTuple<U, 'output'>> {
  protected _typeCheckConfig;

  constructor(readonly shapes: Readonly<U>, options?: TypeConstraintOptions | Message) {
    super(isAsyncShapes(shapes));
    this._typeCheckConfig = createCheckConfig(options, CODE_TUPLE, MESSAGE_TUPLE, shapes.length);
  }

  at(key: any): AnyShape | null {
    return isTupleIndex(key, this.shapes.length) ? this.shapes[key] : null;
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferTuple<U, 'output'>> {
    const { shapes, applyChecks, unsafe } = this;
    const shapesLength = shapes.length;

    if (!isArray(input) || input.length !== shapesLength) {
      return raiseIssue(this._typeCheckConfig, input);
    }

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < shapesLength; ++i) {
      const value = input[i];
      const result = shapes[i].apply(value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, i);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if ((unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = input.slice(0);
        }
        output[i] = result.value;
      }
    }

    if (applyChecks !== null && (unsafe || issues === null)) {
      issues = applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output as InferTuple<U, 'output'>);
    }
    return issues;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferTuple<U, 'output'>>> {
    return new Promise(resolve => {
      const { shapes, applyChecks, unsafe } = this;
      const shapesLength = shapes.length;

      if (!isArray(input) || input.length !== shapesLength) {
        return raiseIssue(this._typeCheckConfig, input);
      }

      const promises: Promise<any>[] = [];

      for (let i = 0; i < shapesLength; ++i) {
        const value = input[i];
        promises.push(shapes[i].applyAsync(value, options));
      }

      resolve(
        Promise.all(promises).then(results => {
          let issues: Issue[] | null = null;
          let output = input;

          for (let i = 0; i < shapesLength; ++i) {
            const result = results[i];

            if (result === null) {
              continue;
            }
            if (isArray(result)) {
              unshiftPath(result, i);

              if (!options.verbose) {
                return result;
              }
              issues = concatIssues(issues, result);
              continue;
            }
            if ((unsafe || issues === null) && !isEqual(input[i], result.value)) {
              if (input === output) {
                output = input.slice(0);
              }
              output[i] = result.value;
            }
          }

          if (applyChecks !== null && (unsafe || issues === null)) {
            issues = applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output as InferTuple<U, 'output'>);
          }
          return issues;
        })
      );
    });
  }
}
