import * as d from '../../main';

describe('boolean', () => {
  test('returns a boolean shape', () => {
    expect(d.boolean()).toBeInstanceOf(d.BooleanShape);
  });
});
