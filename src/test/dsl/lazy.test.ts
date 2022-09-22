import { lazy, LazyShape, number } from '../../main';

describe('lazy', () => {
  test('returns an lazy shape', () => {
    expect(lazy(() => number())).toBeInstanceOf(LazyShape);
  });
});
