import { nullable, NullableType, number } from '../../main';

describe('nullable', () => {
  test('returns an nullable type', () => {
    expect(nullable(number())).toBeInstanceOf(NullableType);
  });
});
