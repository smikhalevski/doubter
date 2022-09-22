import { number, NumberShape } from '../../main';

describe('number', () => {
  test('returns an number shape', () => {
    expect(number()).toBeInstanceOf(NumberShape);
  });
});
