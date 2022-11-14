import * as d from '../../main';

describe('bigint', () => {
  test('returns a bigint shape', () => {
    expect(d.bigint()).toBeInstanceOf(d.BigIntShape);
  });
});
