import { integer, IntegerShape } from '../../main';

describe('integer', () => {
  test('returns an integer shape', () => {
    expect(integer()).toBeInstanceOf(IntegerShape);
  });
});
