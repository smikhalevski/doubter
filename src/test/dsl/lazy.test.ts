import * as d from '../../main';

describe('lazy', () => {
  test('infers type', () => {
    const value: number = d.lazy(() => d.string().transform(parseFloat)).parse('111');
  });

  test('returns a shape', () => {
    const shape = d.string();
    const lazyShape = d.lazy(() => shape);

    expect(lazyShape).toBeInstanceOf(d.LazyShape);
    expect(lazyShape.async).toBe(false);
    expect(lazyShape.shape).toBe(shape);
  });

  test('returns an async shape', () => {
    const shape = d.string();
    const lazyShape = d.lazyAsync(() => shape);

    expect(lazyShape).toBeInstanceOf(d.LazyShape);
    expect(lazyShape.async).toBe(true);
    expect(lazyShape.shape).toBe(shape);
  });
});
