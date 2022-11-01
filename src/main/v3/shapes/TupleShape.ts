import { AnyShape, Shape } from './Shape';
import { ApplyResult, Issue, Message, ParserOptions, Tuple, TypeCheckOptions } from '../shared-types';
import { concatIssues, createCheckConfig, ok, raiseIssue, unshiftPath } from '../shape-utils';
import { CODE_TUPLE, MESSAGE_TUPLE } from '../../shapes/constants';
import { isArray, isEqual } from '../lang-utils';

export type InferTuple<U extends Tuple<AnyShape>, C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] };

export class TupleShape<U extends Tuple<AnyShape>> extends Shape<InferTuple<U, 'input'>, InferTuple<U, 'output'>> {
  private _typeCheckConfig;

  constructor(readonly shapes: Readonly<U>, options?: TypeCheckOptions | Message) {
    super(false);
    this._typeCheckConfig = createCheckConfig(options, CODE_TUPLE, MESSAGE_TUPLE, shapes.length);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<InferTuple<U, 'output'>> {
    const { shapes, _applyChecks, _unsafe } = this;
    const shapesLength = shapes.length;

    if (!isArray(input) || input.length !== shapesLength) {
      return raiseIssue(this._typeCheckConfig, input);
    }

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < shapesLength; ++i) {
      const value = input[i];
      const result = shapes[i]._apply(value, options);

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
      if ((_unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = input.slice(0);
        }
        output[i] = result.value;
      }
    }

    if (_applyChecks !== null && (_unsafe || issues === null)) {
      issues = _applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output as InferTuple<U, 'output'>);
    }
    return issues;
  }

  _applyAsync(input: unknown, options: ParserOptions): Promise<ApplyResult<InferTuple<U, 'output'>>> {
    return new Promise(resolve => {
      const { shapes, _applyChecks, _unsafe } = this;
      const shapesLength = shapes.length;

      if (!isArray(input) || input.length !== shapesLength) {
        return raiseIssue(this._typeCheckConfig, input);
      }

      const promises: Promise<any>[] = [];

      for (let i = 0; i < shapesLength; ++i) {
        const value = input[i];
        promises.push(shapes[i]._applyAsync(value, options));
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
            if ((_unsafe || issues === null) && !isEqual(input[i], result.value)) {
              if (input === output) {
                output = input.slice(0);
              }
              output[i] = result.value;
            }
          }

          if (_applyChecks !== null && (_unsafe || issues === null)) {
            issues = _applyChecks(output, issues, options);
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
