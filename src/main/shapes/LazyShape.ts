import { AnyShape, ApplyResult, DeepPartialProtocol, DeepPartialShape, Shape, ValueType } from './Shape';
import { ParseOptions } from '../shared-types';
import { copyUnsafeChecks, isArray, returnArray, returnFalse, toDeepPartialShape } from '../utils';
import { ERROR_SHAPE_EXPECTED } from '../constants';

/**
 * Lazily resolves a shape using the provider.
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
   * @param shapeProvider The provider that returns the resolved shape.
   * @template S The resolved shape.
   */
  constructor(shapeProvider: () => S) {
    super();

    this._shapeProvider = shapeProvider;
  }

  /**
   * The resolved shape.
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

  protected _requiresAsync(): boolean {
    const { _requiresAsync } = this;

    this._requiresAsync = returnFalse;

    try {
      return this.shape.async;
    } finally {
      this._requiresAsync = _requiresAsync;
    }
  }

  protected _getInputTypes(): readonly ValueType[] {
    const { _getInputTypes } = this;

    this._getInputTypes = returnArray;

    try {
      return this.shape['_getInputTypes']();
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
    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
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
      if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
        return result;
      }
      return issues;
    });
  }
}
