import { vi } from 'vitest';
import { ParseOptions, Result, Shape } from '../../main/core';

export class MockShape extends Shape {
  constructor() {
    super();

    spyOnShape(this);
  }
}

export interface MockShape {
  _apply(input: unknown, options: ParseOptions, nonce: number): Result;

  _applyAsync(input: unknown, options: ParseOptions, nonce: number): Promise<Result>;
}

export class AsyncMockShape extends MockShape {
  _applyAsync(input: unknown, options: ParseOptions, nonce: number) {
    return new Promise<Result>(resolve => {
      resolve(Shape.prototype['_apply'].call(this, input, options, nonce));
    });
  }

  protected _isAsync(): boolean {
    return true;
  }
}

export function spyOnShape(shape: Shape): MockShape {
  shape['_apply'] = vi.fn(shape['_apply']);
  shape['_applyAsync'] = vi.fn(shape['_applyAsync']);

  return shape as MockShape;
}
