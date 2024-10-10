import * as d from '../../main';
import { AsyncMockShape } from '../shape/mocks';

describe('lazy', () => {
  test('returns a lazy shape', () => {
    const providedShape = d.string();
    const shape = d.lazy(() => providedShape);

    expect(shape).toBeInstanceOf(d.LazyShape);
    expect(shape.isAsync).toBe(false);
    expect(shape.providedShape).toBe(providedShape);
  });

  test('returns an async shape', () => {
    const providedShape = new AsyncMockShape();
    const shape = d.lazy(() => providedShape);

    expect(shape).toBeInstanceOf(d.LazyShape);
    expect(shape.isAsync).toBe(true);
    expect(shape.providedShape).toBe(providedShape);
  });
});
