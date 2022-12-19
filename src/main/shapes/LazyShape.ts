import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, ParseOptions } from '../shared-types';
import { isArray } from '../utils';

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

  protected _shapeProvider;

  /**
   * Creates a new {@linkcode LazyShape} instance.
   *
   * @param shapeProvider The provider that returns the base shape.
   * @template S The base shape.
   */
  constructor(shapeProvider: () => S) {
    super();

    this._shapeProvider = shapeProvider;
  }

  protected _checkAsync(): boolean {
    return this.shape.async;
  }

  protected _getInputTypes(): ValueType[] {
    return this.shape['_getInputTypes']();
  }

  protected _apply(input: any, options: ParseOptions): ApplyResult<S['output']> {
    const { _applyChecks } = this;

    let output = input;
    let issues;

    const result = this.shape['_apply'](input, options);

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

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<S['output']>> {
    const { _applyChecks } = this;

    return this.shape['_applyAsync'](input, options).then(result => {
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
  get(this: LazyShape<AnyShape>) {
    const shape = this._shapeProvider();

    Object.defineProperty(this, 'shape', { value: shape });

    return shape;
  },
});
