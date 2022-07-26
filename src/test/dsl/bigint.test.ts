import { bigint, BigIntType } from '../../main';

describe('bigint', () => {
  test('returns an bigint type', () => {
    expect(bigint()).toBeInstanceOf(BigIntType);
  });
});
