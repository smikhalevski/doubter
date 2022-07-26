import { BooleanType } from '../../main';

describe('BooleanType', () => {
  test('allows a boolean', () => {
    expect(new BooleanType().validate(true)).toBe(null);
  });

  test('raises if value is not a boolean', () => {
    expect(new BooleanType().validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'boolean',
        message: 'Must be a boolean',
        meta: undefined,
      },
    ]);
  });

  test('overrides message for type issue', () => {
    expect(new BooleanType({ message: 'xxx', meta: 'yyy' }).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'boolean',
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });
});
