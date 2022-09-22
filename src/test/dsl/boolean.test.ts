import { boolean, BooleanShape } from '../../main';

describe('boolean', () => {
  test('returns an boolean shape', () => {
    expect(boolean()).toBeInstanceOf(BooleanShape);
  });
});
