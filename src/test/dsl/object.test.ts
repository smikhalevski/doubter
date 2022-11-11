import * as d from '../../main';

describe('object', () => {
  test('returns an object shape', () => {
    expect(d.object({ foo: d.number() })).toBeInstanceOf(d.ObjectShape);
  });
});
