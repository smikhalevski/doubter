import { string } from '../../main';

describe('string', () => {
  test('allows a string', () => {
    expect(string().validate('aaa')).toEqual([]);
  });

  test('raises if value is not a string', () => {
    expect(string().validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
      },
    ]);
  });

  test('raises if string length is not greater than', () => {
    expect(string().min(2).validate('a')).toEqual([
      {
        code: 'stringMinLength',
        path: [],
        input: 'a',
        param: 2,
      },
    ]);
    expect(string().min(2).validate('aa')).toEqual([]);
  });

  test('raises if string length is not less than', () => {
    expect(string().max(2).validate('aaa')).toEqual([
      {
        code: 'stringMaxLength',
        path: [],
        input: 'aaa',
        param: 2,
      },
    ]);
    expect(string().max(2).validate('aa')).toEqual([]);
  });

  test('raises if string does not match a pattern', () => {
    expect(string().pattern(/a+/).validate('bbb')).toEqual([
      {
        code: 'stringPattern',
        path: [],
        input: 'bbb',
        param: /a+/,
      },
    ]);
    expect(string().pattern(/a+/).validate('aaa')).toEqual([]);
  });
});
