import { array, ArrayType, number } from '../../main';

describe('array', () => {
  test('returns an array type', () => {
    expect(array(number())).toBeInstanceOf(ArrayType);
  });
});
