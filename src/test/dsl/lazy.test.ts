import * as d from '../../main';
import { Shape } from '../../main';

describe('lazy', () => {
  test('returns a shape', () => {
    const shape = d.string();
    const lazyShape = d.lazy(() => shape);

    expect(lazyShape).toBeInstanceOf(d.LazyShape);
    expect(lazyShape.async).toBe(false);
    expect(lazyShape.shape).toBe(shape);
  });

  test('returns an async shape', () => {
    class AsyncShape extends Shape {
      protected _requiresAsync() {
        return true;
      }
    }

    const shape = new AsyncShape();
    const lazyShape = d.lazy(() => shape);

    expect(lazyShape).toBeInstanceOf(d.LazyShape);
    expect(lazyShape.async).toBe(true);
    expect(lazyShape.shape).toBe(shape);
  });
});
