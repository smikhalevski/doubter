import * as d from '../../main';

describe('bigint', () => {
  test('returns an bigint shape', () => {
    expect(d.bigint()).toBeInstanceOf(d.BigIntShape);
  });
});
