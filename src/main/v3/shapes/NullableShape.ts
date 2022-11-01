import { ApplyResult, ParserOptions } from '../shared-types';
import { isArray } from '../lang-utils';
import { AnyShape, Shape } from './Shape';

const nullResult: Promise<ApplyResult<null>> = Promise.resolve(null);

export class NullableShape<S extends AnyShape> extends Shape<S['input'] | null, S['output'] | null> {
  constructor(readonly shape: S) {
    super(shape.async);
  }

  _apply(input: unknown, options: ParserOptions): ApplyResult<S['output'] | null> {
    const { _applyChecks } = this;

    let issues;
    let output = input;

    const result = input === null ? null : this.shape._apply(input, options);

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  _applyAsync(input: unknown, options: ParserOptions): Promise<ApplyResult<S['output'] | null>> {
    const { _applyChecks } = this;

    if (input === null) {
      if (_applyChecks !== null) {
        return new Promise(resolve => resolve(_applyChecks(null, null, options)));
      }
      return nullResult;
    }

    return this.shape._applyAsync(input, options).then(result => {
      let issues;
      let output = input;

      if (result !== null) {
        if (isArray(result)) {
          return result;
        }
        output = result.value;
      }

      if (_applyChecks !== null) {
        issues = _applyChecks(output, null, options);

        if (issues !== null) {
          return issues;
        }
      }
      return result;
    });
  }
}
