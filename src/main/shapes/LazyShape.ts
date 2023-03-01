import { AnyShape, DeepPartialProtocol, DeepPartialShape, Result, Shape, ValueType } from './Shape';
import { ParseOptions } from '../shared-types';
import { copyUnsafeChecks, isArray, returnArray, returnFalse, toDeepPartialShape } from '../utils';
import { ERROR_SHAPE_EXPECTED } from '../constants';

/**
 * Lazily resolves a shape using the provider callback.
 *
 * @template S The resolved shape.
 */
export class LazyShape<S extends AnyShape>
  extends Shape<S['input'], S['output']>
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

  protected _getInputTypes(): readonly ValueType[] {
    const { _getInputTypes } = this;

    this._getInputTypes = returnArray;

    try {
      return this.shape.inputTypes;
    } finally {
      this._getInputTypes = _getInputTypes;
    }
  }

  protected _getInputValues(): unknown[] {
    const { _getInputValues } = this;

    this._getInputValues = returnArray;

    try {
      return this.shape['_getInputValues']();
    } finally {
      this._getInputValues = _getInputValues;
    }
  }

  protected _apply(input: unknown, options: ParseOptions): Result<S['output']> {
    return this._handleResult(this.shape['_apply'](input, options), input, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<Result<S['output']>> {
    return this.shape['_applyAsync'](input, options).then(result => this._handleResult(result, input, options));
  }

  private _handleResult(result: Result, input: unknown, options: ParseOptions): Result<S['output']> {
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
