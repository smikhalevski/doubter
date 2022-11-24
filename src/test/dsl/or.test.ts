import * as d from '../../main';

describe('or', () => {
  test('returns an union shape', () => {
    expect(d.or([d.number()])).toBeInstanceOf(d.UnionShape);
  });
});
