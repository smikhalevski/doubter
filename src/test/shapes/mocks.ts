import { ApplyOptions, Result, Shape } from '../../main';

/**
 * Mock async shape.
 */
export class AsyncShape extends Shape {
  protected _isAsync(): boolean {
    return true;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number) {
    return new Promise<Result>(resolve => {
      resolve(Shape.prototype['_apply'].call(this, input, options, nonce));
    });
  }
}
