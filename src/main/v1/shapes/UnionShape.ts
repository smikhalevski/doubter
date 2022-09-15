import { InputConstraintOptions, ParserOptions, Multiple } from '../shared-types';
import { AnyShape, Shape } from './Shape';
import { applyConstraints, isAsync, raiseIssue, raiseOrCaptureIssues } from '../utils';
import { ValidationError } from '../ValidationError';

type OutputUnion<U extends Multiple<AnyShape>> = { [K in keyof U]: U[K]['output'] }[number];

export class UnionShape<U extends Multiple<AnyShape>> extends Shape<
  { [K in keyof U]: U[K]['input'] }[number],
  OutputUnion<U>
> {
  constructor(protected shapes: U, protected options?: InputConstraintOptions) {
    super(isAsync(shapes));
  }

  at(propertyName: unknown): AnyShape | null {
    const childShapes: AnyShape[] = [];

    for (const type of this.shapes) {
      const childShape = type.at(propertyName);

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
    return new UnionShape(childShapes as Multiple<AnyShape>);
  }

  parse(input: unknown, options?: ParserOptions): OutputUnion<U> {
    const { shapes, constraints } = this;

    let rootError: ValidationError | null = null;

    if (constraints !== null) {
      rootError = applyConstraints(input, constraints, options, rootError);
    }

    for (const shape of shapes) {
      try {
        return shape.parse(input);
      } catch (error) {
        // TODO extract issues instead of raise
        rootError = raiseOrCaptureIssues(error, rootError, options);
      }
    }

    if (rootError !== null) {
      raiseIssue(input, 'union', rootError.issues, this.options, 'Must conform a union');
    }
  }

  parseAsync(input: unknown, options?: ParserOptions): Promise<OutputUnion<U>> {
    return new Promise(resolve => {
      const { shapes, constraints } = this;

      let rootError: ValidationError | null = null;

      if (constraints !== null) {
        rootError = applyConstraints(input, constraints, options, rootError);
      }

      const promises = [];

      for (const shape of shapes) {
        promises.push(shape.parseAsync(input, options));
      }

      return Promise.allSettled(promises).then(results => {
        for (const result of results) {
          if (result.status === 'fulfilled') {
            return result.value;
          }
          rootError = raiseOrCaptureIssues(result.reason, rootError, options);
        }

        if (rootError !== null) {
          raiseIssue(input, 'union', rootError.issues, this.options, 'Must conform a union');
        }
      });
    });
  }
}
