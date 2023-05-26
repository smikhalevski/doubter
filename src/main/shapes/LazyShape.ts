import { ERROR_SHAPE_EXPECTED } from '../constants';
import { ApplyOptions, Literal } from '../types';
import { captureIssues, copyUnsafeChecks, identity, isArray, ok, toDeepPartialShape } from '../utils';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, INPUT, OUTPUT, Result, Shape } from './Shape';

/**
 * Lazily resolves a shape using the provider callback.
 *
 * @template ProvidedShape The provided shape.
 * @template CircularValue The value returned when a cyclic reference is detected.
 */
export class LazyShape<ProvidedShape extends AnyShape, CircularValue>
  extends Shape<ProvidedShape[INPUT], ProvidedShape[OUTPUT] | CircularValue>
  implements DeepPartialProtocol<LazyShape<DeepPartialShape<ProvidedShape>, CircularValue>>
{
  /**
   * The provider that caches the returned shape.
   */
  private _cachingShapeProvider;

  /**
   * The map from nonce to an array of inputs seen during parsing.
   */
  private _stackMap = new Map<number, unknown[]>();

  /**
   * Creates a new {@linkcode LazyShape} instance.
   *
   * @param shapeProvider The provider callback that returns the shape to which {@linkcode LazyShape} delegates input
   * handling. The provider is called only once.
   * @param circularValueProvider The provider callback that returns the value that is used instead of a circular reference.
   * @template ProvidedShape The provided shape.
   */
  constructor(
    /**
     * The provider callback that returns the shape to which {@linkcode LazyShape} delegates input handling.
     */
    readonly shapeProvider: () => ProvidedShape,
    /**
     * The provider callback that returns the value that is used instead of a circular reference.
     */
    readonly circularValueProvider: (value: ProvidedShape[INPUT], options: Readonly<ApplyOptions>) => CircularValue
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
  get shape(): ProvidedShape {
    Object.defineProperty(this, 'shape', { configurable: true, value: undefined });

    const shape = this._cachingShapeProvider();

    Object.defineProperty(this, 'shape', { configurable: true, value: shape });

    return shape;
  }

  deepPartial(): LazyShape<DeepPartialShape<ProvidedShape>, DeepPartialShape<ProvidedShape>[INPUT]> {
    const { _cachingShapeProvider } = this;

    return copyUnsafeChecks(this, new LazyShape(() => toDeepPartialShape(_cachingShapeProvider()), identity));
  }

  circular<CircularValue extends Literal>(
    value: CircularValue | ((value: ProvidedShape[INPUT], options: Readonly<ApplyOptions>) => CircularValue)
  ): LazyShape<ProvidedShape, CircularValue> {
    return copyUnsafeChecks(
      this,
      new LazyShape(this.shapeProvider, typeof value === 'function' ? (value as () => CircularValue) : () => value)
    );
  }

  protected _isAsync(): boolean {
    return this.shape.isAsync;
  }

  protected _getInputs(): unknown[] {
    return this.shape.inputs.slice(0);
  }

  protected _clone(): this {
    const shape = super._clone();
    shape._stackMap = new Map();
    return shape;
  }

  protected _apply(
    input: unknown,
    options: ApplyOptions,
    nonce: number
  ): Result<ProvidedShape[OUTPUT] | CircularValue> {
    const { _stackMap } = this;

    let stack = _stackMap.get(nonce);

    const leading = stack === undefined;

    if (stack === undefined) {
      stack = [input];
      _stackMap.set(nonce, stack);
    } else if (stack.includes(input)) {
      let output;
      try {
        output = this.circularValueProvider(input, options);
      } catch (error) {
        return captureIssues(error);
      }
      return input === output ? null : ok(output);
    } else {
      stack.push(input);
    }

    try {
      return this._handleResult(this.shape['_apply'](input, options, nonce), input, options);
    } finally {
      if (leading) {
        _stackMap.delete(nonce);
      }
    }
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<ProvidedShape[OUTPUT]>> {
    const { _stackMap } = this;

    let stack = _stackMap.get(nonce);

    const leading = stack === undefined;

    if (stack === undefined) {
      stack = [input];
      _stackMap.set(nonce, stack);
    } else if (stack.includes(input)) {
      return new Promise(resolve => {
        let output;
        try {
          output = this.circularValueProvider(input, options);
        } catch (error) {
          resolve(captureIssues(error));
          return;
        }
        resolve(input === output ? null : ok(output));
      });
    } else {
      stack.push(input);
    }

    return this.shape['_applyAsync'](input, options, nonce).then(
      result => {
        if (leading) {
          _stackMap.delete(nonce);
        }
        return this._handleResult(result, input, options);
      },
      error => {
        if (leading) {
          _stackMap.delete(nonce);
        }
        throw error;
      }
    );
  }

  private _handleResult(result: Result, input: unknown, options: ApplyOptions): Result<ProvidedShape[OUTPUT]> {
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
