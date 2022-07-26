import { number, NumberType } from '../../main';

describe('number', () => {
  test('returns an number type', () => {
    expect(number()).toBeInstanceOf(NumberType);
  });
});
