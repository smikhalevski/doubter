import { ERROR_SHAPE_EXPECTED } from '../constants';
import { ApplyOptions } from '../types';
import { copyUnsafeChecks, isArray, returnArray, returnFalse, toDeepPartialShape } from '../utils';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, INPUT, OUTPUT, Result, Shape } from './Shape';

/**
 * Lazily resolves a shape using the provider callback.
 *
 * @template S The resolved shape.
 */
export class LazyShape<S extends AnyShape>
  extends Shape<S[INPUT], S[OUTPUT]>
  implements DeepPartialProtocol<LazyShape<DeepPartialShape<S>>>
{
  protected _shapeProvider;

  /**
   * Creates a new {@linkcode LazyShape} instance.
   *
   * @param shapeProvider The provider callback that returns the shape.
   * @template S The resolved shape.
   */
  constructor(shapeProvider: () => S) {
    super();

    this._shapeProvider = shapeProvider;
  }

  /**
   * The lazy-loaded shape.
   */
  get shape(): S {
    const shape = this._shapeProvider();

    if (!(shape instanceof Shape)) {
      throw new Error(ERROR_SHAPE_EXPECTED);
    }

    Object.defineProperty(this, 'shape', { value: shape });

    return shape;
  }

  deepPartial(): LazyShape<DeepPartialShape<S>> {
    const { _shapeProvider } = this;

    return copyUnsafeChecks(this, new LazyShape(() => toDeepPartialShape(_shapeProvider())));
  }

  protected _isAsync(): boolean {
    const { _isAsync } = this;

    this._isAsync = returnFalse;

    try {
      return this.shape.isAsync;
    } finally {
      this._isAsync = _isAsync;
    }
  }

  protected _getInputs(): unknown[] {
    const { _getInputs } = this;

    this._getInputs = returnArray;

    try {
      return this.shape.inputs.slice(0);
    } finally {
      this._getInputs = _getInputs;
    }
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<S[OUTPUT]> {
    return this._handleResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<S[OUTPUT]>> {
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(result: Result, input: unknown, options: ApplyOptions): Result<S[OUTPUT]> {
    const { _applyChecks } = this;

    let output = input;
    let issues;

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }
    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }
}
