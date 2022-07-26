import { integer, IntegerType } from '../../main';

describe('integer', () => {
  test('returns an integer type', () => {
    expect(integer()).toBeInstanceOf(IntegerType);
  });
});
