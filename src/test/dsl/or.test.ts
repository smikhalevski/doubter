import { number, or, UnionType } from '../../main';

describe('or', () => {
  test('returns an union type', () => {
    expect(or([number()])).toBeInstanceOf(UnionType);
  });
});
