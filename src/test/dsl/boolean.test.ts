import * as d from '../../main';

describe('boolean', () => {
  test('returns an boolean shape', () => {
    expect(d.boolean()).toBeInstanceOf(d.BooleanShape);
  });
});
