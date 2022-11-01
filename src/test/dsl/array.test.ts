import * as d from '../../main';

describe('array', () => {
  test('returns an array shape', () => {
    expect(d.array(d.number())).toBeInstanceOf(d.ArrayShape);
  });
});
