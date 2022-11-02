import { ApplyResult, ParseOptions } from '../shared-types';
import { ok } from '../shape-utils';
import { isArray } from '../lang-utils';
import { AnyShape, Shape } from './Shape';

export class OptionalShape<S extends AnyShape, T extends S['output'] | undefined = undefined> extends Shape<
  S['input'] | undefined,
  S['output'] | T
> {
  protected _defaultResult: ApplyResult<T>;
  protected _defaultAsyncResult: Promise<ApplyResult<T>> | undefined;

  constructor(readonly shape: S, readonly defaultValue?: T) {
    super(shape.async);

    this._defaultResult = defaultValue === undefined ? null : ok(defaultValue);

    if (shape.async) {
      this._defaultAsyncResult = Promise.resolve(this._defaultResult);
    }
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<S['output'] | T> {
    const { applyChecks } = this;

    let issues;
    let output = input;

    const result = input === undefined ? this._defaultResult : this.shape.apply(input, options);

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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output'] | T>> {
    const { applyChecks } = this;

    let issues;

    if (input === undefined) {
      if (applyChecks !== null) {
        return new Promise(resolve => {
          issues = applyChecks(this.defaultValue, null, options);

          resolve(issues !== null ? issues : this._defaultResult);
        });
      }
      return this._defaultAsyncResult!;
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
