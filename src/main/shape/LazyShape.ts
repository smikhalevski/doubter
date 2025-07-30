import { ERROR_SHAPE_EXPECTED } from '../constants.js';
import { identity, isArray } from '../internal/lang.js';
import { defineReadonlyProperty } from '../internal/objects.js';
import { captureIssues, copyOperations, ok, toDeepPartialShape } from '../internal/shapes.js';
import { Any, ParseOptions, Result } from '../types.js';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Input, Output, Shape } from './Shape.js';

/**
 * Lazily loads a shape using the provider callback.
 *
 * @template ProvidedShape The lazy-loaded shape.
 * @template Pointer The value returned when a cyclic reference is detected.
 * @group Shapes
 */
export class LazyShape<ProvidedShape extends AnyShape, Pointer>
  extends Shape<Input<ProvidedShape>, Output<ProvidedShape> | Pointer>
  implements DeepPartialProtocol<LazyShape<DeepPartialShape<ProvidedShape>, Pointer>>
{
  /**
   * The provider that caches the returned shape.
   */
  private _cachingShapeProvider;

  /**
   * The map from nonce to an array of inputs seen during parsing.
   */
  private _seenInputsMap = new Map<number, unknown[]>();

  /**
   * Creates a new {@link LazyShape} instance.
   *
   * @param shapeProvider The provider callback that returns the shape to which {@link LazyShape} delegates input
   * handling. The provider is called only once.
   * @param pointerProvider The provider callback that returns the value that is used instead of a circular
   * reference.
   * @template ProvidedShape The lazy-loaded shape.
   * @template Pointer The value returned when a cyclic reference is detected.
   */
  constructor(
    /**
     * The provider callback that returns the shape to which {@link LazyShape} delegates input handling.
     */
    readonly shapeProvider: () => ProvidedShape,
    /**
     * The provider callback that returns the value that is used instead of a circular reference.
     */
    readonly pointerProvider: (value: Input<ProvidedShape>, options: ParseOptions) => Pointer
  ) {
    super();

    // 0 = unavailable
    // 1 = recursive resolution
    let shape: 0 | 1 | ProvidedShape = 0;

    this._cachingShapeProvider = () => {
      if (shape !== 1 && (shape !== 0 || ((shape = 1), (shape = shapeProvider())) instanceof Shape)) {
        return shape;
      }
      shape = 0;
      throw new Error(ERROR_SHAPE_EXPECTED);
    };
  }

  /**
   * The lazy-loaded shape.
   */
  get providedShape(): ProvidedShape {
    return defineReadonlyProperty(this, 'providedShape', this._cachingShapeProvider());
  }

  at(key: unknown): AnyShape | null {
    return this.providedShape.at(key);
  }

  deepPartial(): LazyShape<DeepPartialShape<ProvidedShape>, Input<DeepPartialShape<ProvidedShape>>> {
    const { _cachingShapeProvider } = this;

    return new LazyShape(() => toDeepPartialShape(_cachingShapeProvider()), identity);
  }

  /**
   * Replace circular references with a placeholder.
   *
   * @param pointer The value that would be used instead of circular references, or a callback that returns such a
   * value.
   * @template Pointer The value returned when a cyclic reference is detected.
   * @returns The clone of the shape.
   */
  circular<Pointer extends Any>(
    pointer: Pointer | ((value: Input<ProvidedShape>, options: ParseOptions) => Pointer)
  ): LazyShape<ProvidedShape, Pointer> {
    return copyOperations(
      this,
      new LazyShape(this.shapeProvider, typeof pointer === 'function' ? (pointer as () => Pointer) : () => pointer)
    );
  }

  protected _isAsync(): boolean {
    return this.providedShape.isAsync;
  }

  protected _getInputs(): readonly unknown[] {
    return this.providedShape.inputs.slice(0);
  }

  protected _clone(): this {
    const shape = super._clone();
    shape._seenInputsMap = new Map();
    return shape;
  }

  protected _apply(input: unknown, options: ParseOptions, nonce: number): Result<Output<ProvidedShape> | Pointer> {
    const { _seenInputsMap } = this;

    let output = input;
    let result;
    let seenInputs = _seenInputsMap.get(nonce);

    if (seenInputs === undefined) {
      seenInputs = [input];
      _seenInputsMap.set(nonce, seenInputs);
    } else if (seenInputs.includes(input)) {
      try {
        output = this.pointerProvider(input, options);
      } catch (error) {
        return captureIssues(error);
      }
      return input === output ? null : ok(output);
    } else {
      seenInputs.push(input);
    }

    try {
      result = this.providedShape['_apply'](input, options, nonce);
    } finally {
      _seenInputsMap.delete(nonce);
    }

    if (result !== null) {
      if (isArray(result)) {
        return result;
      }
      output = result.value;
    }
    return this._applyOperations(input, output, options, null) as Result;
  }

  protected _applyAsync(
    input: unknown,
    options: ParseOptions,
    nonce: number
  ): Promise<Result<Output<ProvidedShape> | Pointer>> {
    const { _seenInputsMap } = this;

    let output = input;
    let seenInputs = _seenInputsMap.get(nonce);

    if (seenInputs === undefined) {
      seenInputs = [input];
      _seenInputsMap.set(nonce, seenInputs);
    } else if (seenInputs.includes(input)) {
      return new Promise(resolve => {
        try {
          output = this.pointerProvider(input, options);
        } catch (error) {
          resolve(captureIssues(error));
          return;
        }
        resolve(input === output ? null : ok(output));
      });
    } else {
      seenInputs.push(input);
    }

    return this.providedShape['_applyAsync'](input, options, nonce).then(
      result => {
        _seenInputsMap.delete(nonce);

        if (result !== null) {
          if (isArray(result)) {
            return result;
          }
          output = result.value;
        }
        return this._applyOperations(input, output, options, null);
      },
      error => {
        _seenInputsMap.delete(nonce);
        throw error;
      }
    );
  }
}
