import { never, NeverType } from '../../main';

describe('never', () => {
  test('returns an never type', () => {
    expect(never()).toBeInstanceOf(NeverType);
  });
});
