import { UnconstrainedType } from '../../main';

describe('UnconstrainedType', () => {
  test('returns the input as is', () => {
    expect(new UnconstrainedType<number>().parse('aaa')).toBe('aaa');
  });
});
