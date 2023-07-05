import * as d from '../../main';
import { AsyncShape } from '../shapes/mocks';

describe('lazy', () => {
  test('returns a lazy shape', () => {
    const shape = d.string();
    const lazyShape = d.lazy(() => shape);

    expect(lazyShape).toBeInstanceOf(d.LazyShape);
    expect(lazyShape.isAsync).toBe(false);
    expect(lazyShape.shape).toBe(shape);
  });

  test('returns an async shape', () => {
    const shape = new AsyncShape();
    const lazyShape = d.lazy(() => shape);

    expect(lazyShape).toBeInstanceOf(d.LazyShape);
    expect(lazyShape.isAsync).toBe(true);
    expect(lazyShape.shape).toBe(shape);
  });
});
