import * as d from '../../main';

describe('tuple', () => {
  test('returns an array shape', () => {
    expect(d.tuple([d.number()])).toBeInstanceOf(d.ArrayShape);
  });
});
