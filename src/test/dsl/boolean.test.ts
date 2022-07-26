import { boolean, BooleanType } from '../../main';

describe('boolean', () => {
  test('returns an boolean type', () => {
    expect(boolean()).toBeInstanceOf(BooleanType);
  });
});
