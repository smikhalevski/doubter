import { lazy, LazyType, number } from '../../main';

describe('lazy', () => {
  test('returns an lazy type', () => {
    expect(lazy(() => number())).toBeInstanceOf(LazyType);
  });
});
