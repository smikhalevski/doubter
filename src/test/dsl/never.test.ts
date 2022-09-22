import { never, NeverShape } from '../../main';

describe('never', () => {
  test('returns an never shape', () => {
    expect(never()).toBeInstanceOf(NeverShape);
  });
});
