import { NeverShape } from '../../main';
import { CODE_NEVER } from '../../main/constants';

describe('NeverShape', () => {
  test('always raises', () => {
    expect(new NeverShape().validate(111)).toEqual([
      {
        code: CODE_NEVER,
        path: [],
        input: 111,
        param: undefined,
        message: 'Must not be used',
        meta: undefined,
      },
    ]);
  });
});
