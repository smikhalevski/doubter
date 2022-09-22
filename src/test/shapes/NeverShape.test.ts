import { NeverShape } from '../../main';
import { CODE_NEVER, MESSAGE_NEVER } from '../../main/shapes/constants';

describe('NeverShape', () => {
  test('always raises', () => {
    expect(new NeverShape().validate(111)).toEqual([
      {
        code: CODE_NEVER,
        path: [],
        input: 111,
        param: undefined,
        message: MESSAGE_NEVER,
        meta: undefined,
      },
    ]);
  });
});
