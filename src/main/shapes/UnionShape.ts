import { AnyShape, Shape } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createCheckConfig, createIssue, isArray, isAsyncShapes } from '../utils';
import { CODE_UNION, MESSAGE_UNION } from './constants';

export type InferUnion<U extends AnyShape[], C extends 'input' | 'output'> = { [K in keyof U]: U[K][C] }[number];

/**
 * The shape that requires an input to conform at least one of the united shapes.
 *
 * @template U The list of united type definitions.
 */
export class UnionShape<U extends AnyShape[]> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  protected _typeCheckConfig;

  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The list of united shapes.
   * @param options The union constraint options or an issue message.
   */
  constructor(readonly shapes: Readonly<U>, options?: TypeConstraintOptions | Message) {
    super(isAsyncShapes(shapes));

    this._typeCheckConfig = createCheckConfig(options, CODE_UNION, MESSAGE_UNION, undefined);
  }

  at(key: unknown): AnyShape | null {
    const childShapes: AnyShape[] = [];

    for (const shape of this.shapes) {
      const childShape = shape.at(key);

      if (childShape !== null) {
        childShapes.push(childShape);
      }
    }
    if (childShapes.length === 0) {
      return null;
    }
    if (childShapes.length === 1) {
      return childShapes[0];
    }
    return new UnionShape(childShapes as U);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferUnion<U, 'output'>> {
    const { shapes, _applyChecks, _unsafe } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;

    for (let i = 0; i < shapesLength; ++i) {
      const result = shapes[i].apply(input, options);

      if (result === null) {
        return null;
      }
      if (isArray(result)) {
        issues = concatIssues(issues, result);
        continue;
      }
      return result;
    }

    if (_applyChecks !== null && _unsafe) {
      issues = _applyChecks(input, issues, options);
    }
    return [createIssue(this._typeCheckConfig, input, issues)];
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferUnion<U, 'output'>>> {
    const { shapes, _applyChecks, _unsafe } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;
    let index = 0;

    const nextShape = (): Promise<ApplyResult<InferUnion<U, 'output'>>> => {
      return shapes[index].applyAsync(input, options).then(result => {
        ++index;

        if (result === null) {
          return null;
        }

        if (isArray(result)) {
          issues = concatIssues(issues, result);

          if (index < shapesLength) {
            return nextShape();
          }

          if (_applyChecks !== null && _unsafe) {
            issues = _applyChecks(input, issues, options);
          }
          return [createIssue(this._typeCheckConfig, input, issues)];
        }

        return result;
      });
    };

    return nextShape();
  }
}
