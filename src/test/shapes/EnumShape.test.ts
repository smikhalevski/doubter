import { EnumShape } from '../../main';
import { CODE_ENUM, MESSAGE_ENUM } from '../../main/shapes/constants';

describe('EnumShape', () => {
  test('allows the value from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).validate('aaa')).toBe(null);
  });

  test('raises issue when value is not one of values from the list', () => {
    expect(new EnumShape(['aaa', 'bbb']).validate('ccc')).toEqual([
      {
        code: CODE_ENUM,
        path: [],
        input: 'ccc',
        param: ['aaa', 'bbb'],
        message: MESSAGE_ENUM + 'aaa, bbb',
        meta: undefined,
      },
    ]);
  });
});
