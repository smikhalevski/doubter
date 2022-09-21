import { UnconstrainedShape } from '../../../main';

describe('UnconstrainedShape', () => {
  test('returns the input as is', () => {
    expect(new UnconstrainedShape<number>().parse('aaa')).toBe('aaa');
  });
});
