import { ERROR_SHAPE_EXPECTED } from '../constants';
import { ApplyOptions } from '../types';
import { copyUnsafeChecks, isArray, toDeepPartialShape } from '../utils';
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
  /**
   * The provider that returns the memoized shape.
   */
  private _shapeProvider;

  /**
   * Creates a new {@linkcode LazyShape} instance.
   *
   * @param shapeProvider The provider callback that returns the shape to which {@linkcode LazyShape} delegates input
   * handling. The provider is called only once.
   * @template S The resolved shape.
   */
  constructor(shapeProvider: () => S) {
    super();

    let shape: S | null = null;

    this._shapeProvider = () => {
      if (shape !== null || (shape = shapeProvider()) instanceof Shape) {
        return shape;
      }
      shape = null;
      throw new Error(ERROR_SHAPE_EXPECTED);
    };
  }

  /**
   * The lazy-loaded shape.
   */
  get shape(): S {
    Object.defineProperty(this, 'shape', { configurable: true, value: undefined });

    const shape = this._shapeProvider();

    Object.defineProperty(this, 'shape', { configurable: true, value: shape });

    return shape;
  }

  deepPartial(): LazyShape<DeepPartialShape<S>> {
    const { _shapeProvider } = this;

    return copyUnsafeChecks(this, new LazyShape(() => toDeepPartialShape(_shapeProvider())));
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.shape.inputs.slice(0);
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
