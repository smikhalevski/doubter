import { ApplyOptions, Result, Shape } from '../../main';

export class MockShape extends Shape {
  constructor() {
    super();

    spyOnShape(this);
  }
}

export interface MockShape {
  _apply(input: unknown, options: ApplyOptions, nonce: number): Result;

  _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result>;
}

export class AsyncMockShape extends MockShape {
  protected _isAsync(): boolean {
    return true;
  }

  _applyAsync(input: unknown, options: ApplyOptions, nonce: number) {
    return new Promise<Result>(resolve => {
      resolve(Shape.prototype['_apply'].call(this, input, options, nonce));
    });
  }
}

export function spyOnShape(shape: Shape): MockShape {
  // Ensure that _apply* methods of the shape are overridden if needed
  shape.isAsync;

  shape['_apply'] = jest.fn(shape['_apply']);
  shape['_applyAsync'] = jest.fn(shape['_applyAsync']);

  return shape as MockShape;
}
