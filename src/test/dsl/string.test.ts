import * as d from '../../main';

describe('string', () => {
  test('returns an string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });
});
