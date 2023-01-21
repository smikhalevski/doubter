import * as d from '../../main';

describe('object', () => {
  test('returns an object shape', () => {
    expect(d.object({ key1: d.number() })).toBeInstanceOf(d.ObjectShape);
  });
});
