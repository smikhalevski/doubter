import { BooleanShape } from '../../main';
import { CODE_TYPE, TYPE_BOOLEAN } from '../../main/shapes/constants';

describe('BooleanShape', () => {
  test('allows a boolean', () => {
    expect(new BooleanShape().validate(true)).toBe(null);
  });

  test('raises if value is not a boolean', () => {
    expect(new BooleanShape().validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_BOOLEAN,
        message: 'Must be a boolean',
        meta: undefined,
      },
    ]);
  });

  test('overrides message for type issue', () => {
    expect(new BooleanShape({ message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_BOOLEAN,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });
});
