import { ApplyResult, ParseOptions } from '../shared-types';
import { isArray } from '../lang-utils';
import { AnyShape, Shape } from './Shape';

const nullResult: Promise<ApplyResult<null>> = Promise.resolve(null);

export class NullableShape<S extends AnyShape> extends Shape<S['input'] | null, S['output'] | null> {
  constructor(readonly shape: S) {
    super(shape.async);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<S['output'] | null> {
    const { applyChecks } = this;

    let issues;
    let output = input;

    const result = input === null ? null : this.shape.apply(input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (applyChecks !== null) {
      issues = applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output'] | null>> {
    const { applyChecks } = this;

    if (input === null) {
      if (applyChecks !== null) {
        return new Promise(resolve => resolve(applyChecks(null, null, options)));
      }
      return nullResult;
    }

    return this.shape.applyAsync(input, options).then(result => {
      let issues;
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      if (applyChecks !== null) {
        issues = applyChecks(output, null, options);

        if (issues !== null) {
          return issues;
        }
      }
      return result;
    });
  }
}
