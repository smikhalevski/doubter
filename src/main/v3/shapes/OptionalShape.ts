import { ApplyResult, ParserOptions } from '../shared-types';
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

  _apply(input: unknown, options: Readonly<ParserOptions>): ApplyResult<S['output'] | T> {
    const { shape, _applyChecks } = this;

    let issues;

    const result = input === undefined ? this._defaultResult : shape._apply(input, options);

    if (result !== null && isArray(result)) {
      return result;
    }

    if (_applyChecks !== null) {
      issues = _applyChecks(result === null ? input : result.value, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  _applyAsync(input: unknown, options: Readonly<ParserOptions>): Promise<ApplyResult<S['output'] | T>> {
    const { shape, _applyChecks } = this;

    let issues;

    if (input === undefined) {
      if (_applyChecks !== null) {
        issues = _applyChecks(this.defaultValue, null, options);

        if (issues !== null) {
          return Promise.resolve(issues);
        }
      }
      return this._defaultAsyncResult!;
    }

    return shape._applyAsync(input, options).then(result => {
      if (result !== null && isArray(result)) {
        return result;
      }

      if (_applyChecks !== null) {
        issues = _applyChecks(result === null ? input : result.value, null, options);

        if (issues !== null) {
          return issues;
        }
      }
      return result;
    });
  }
}
