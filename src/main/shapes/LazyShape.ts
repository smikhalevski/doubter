import { AnyShape, Shape } from './Shape';
import { ApplyResult, ParseOptions } from '../shared-types';
import { anyTypes, isArray } from '../utils';

/**
 * Lazily resolves a shape using the provider.
 *
 * @template S The base shape.
 */
export class LazyShape<S extends AnyShape> extends Shape<S['input'], S['output']> {
  /**
   * The base shape.
   */
  declare readonly shape: S;

  /**
   * The callback that returns the base shape.
   */
  protected _provider;

  /**
   * Creates a new {@linkcode LazyShape} instance.
   *
   * @param provider The provider that returns the base shape.
   * @param async If `true` the shape would support both sync and async base shapes, otherwise only sync shapes are
   * allowed.
   * @template S The base shape.
   */
  constructor(provider: () => S, async: boolean) {
    super(anyTypes, async);

    this._provider = provider;
  }

  apply(input: any, options: ParseOptions): ApplyResult<S['output']> {
    const { _applyChecks } = this;

    let output = input;
    let issues;

    const result = this.shape.apply(input, options);

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

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output']>> {
    const { _applyChecks } = this;

    return this.shape.applyAsync(input, options).then(result => {
      let output = input;
      let issues;

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

Object.defineProperty(LazyShape.prototype, 'shape', {
  get() {
    const shape = this._provider();
    Object.defineProperty(this, 'shape', { value: shape, enumerable: true });
    return shape;
  },
});
