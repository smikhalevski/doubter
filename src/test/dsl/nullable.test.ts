import { nullable, NullableShape, number } from '../../main';

describe('nullable', () => {
  test('returns an nullable shape', () => {
    expect(nullable(number())).toBeInstanceOf(NullableShape);
  });
});
