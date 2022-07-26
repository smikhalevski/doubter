import { number, optional, OptionalType } from '../../main';

describe('optional', () => {
  test('returns an optional type', () => {
    expect(optional(number())).toBeInstanceOf(OptionalType);
  });
});
