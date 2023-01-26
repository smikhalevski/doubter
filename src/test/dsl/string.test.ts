import * as d from '../../main';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });
});
