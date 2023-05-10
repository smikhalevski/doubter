import { CODE_CYCLIC, ERROR_SHAPE_EXPECTED, MESSAGE_CYCLIC } from '../constants';
import { ApplyOptions, ConstraintOptions, Message } from '../types';
import { copyUnsafeChecks, createIssueFactory, isArray, toDeepPartialShape } from '../utils';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, INPUT, OUTPUT, Result, Shape } from './Shape';

/**
 * Lazily resolves a shape using the provider callback.
 *
 * @template ProvidedShape The provided shape.
 */
export class LazyShape<ProvidedShape extends AnyShape>
  extends Shape<ProvidedShape[INPUT], ProvidedShape[OUTPUT]>
  implements DeepPartialProtocol<LazyShape<DeepPartialShape<ProvidedShape>>>
{
  /**
   * `true` is cyclic objects are handled, or `false` otherwise.
   */
  isCyclic = false;

  /**
   * The provider caches the returned shape.
   */
  private _shapeProvider;

  /**
   * The map from nonce to an array of inputs seen during parsing.
   */
  private _stackMap = new Map<number, unknown[]>();

  private _cyclicProvider: (input: unknown, options: Readonly<ApplyOptions>) => Result<S>;

  /**
   * Creates a new {@linkcode LazyShape} instance.
   *
   * @param shapeProvider The provider callback that returns the shape to which {@linkcode LazyShape} delegates input
   * handling. The provider is called only once.
   * @param options The constraint options or an issue message.
   * @template ProvidedShape The provided shape.
   */
  constructor(shapeProvider: () => ProvidedShape, options?: ConstraintOptions | Message) {
    super();

    this._cyclicProvider = createIssueFactory(CODE_CYCLIC, MESSAGE_CYCLIC, options, undefined);

    // 0 = unavailable
    // 1 = pending
    let shape: 0 | 1 | ProvidedShape = 0;

    this._shapeProvider = () => {
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

    const shape = this._shapeProvider();

    Object.defineProperty(this, 'shape', { configurable: true, value: shape });

    return shape;
  }

  deepPartial(): LazyShape<DeepPartialShape<ProvidedShape>> {
    const { _shapeProvider } = this;

    return copyUnsafeChecks(this, new LazyShape(() => toDeepPartialShape(_shapeProvider())));
  }

  /**
   * Allow the lazy shape to handle cyclic objects.
   */
  cyclic(): this {
    const shape = this._clone();
    shape.isCyclic = true;
    shape._cyclicProvider = () => null;
    return shape;
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

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<ProvidedShape[OUTPUT]> {
    const { _stackMap } = this;

    let stack = _stackMap.get(nonce);

    const leading = stack === undefined;

    if (stack === undefined) {
      stack = [input];
      _stackMap.set(nonce, stack);
    } else if (stack.includes(input)) {
      return this._cyclicProvider(input, options);
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
      return Promise.resolve(this._cyclicProvider(input, options));
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
