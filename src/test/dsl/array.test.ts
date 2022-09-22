import { array, ArrayShape, number } from '../../main';

describe('array', () => {
  test('returns an array shape', () => {
    expect(array(number())).toBeInstanceOf(ArrayShape);
  });
});
