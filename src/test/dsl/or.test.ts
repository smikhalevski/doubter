import * as d from '../../main';

describe('or', () => {
  test('returns a union shape', () => {
    expect(d.or([d.number()])).toBeInstanceOf(d.UnionShape);
  });
});
