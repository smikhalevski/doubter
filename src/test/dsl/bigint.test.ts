import { bigint, BigIntShape } from '../../main';

describe('bigint', () => {
  test('returns an bigint shape', () => {
    expect(bigint()).toBeInstanceOf(BigIntShape);
  });
});
