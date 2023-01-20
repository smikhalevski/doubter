import { JSONShape } from '../../main';
import { CODE_JSON, CODE_TYPE, MESSAGE_STRING_TYPE, TYPE_STRING } from '../../main/constants';

describe('JSONShape', () => {
  test('parses JSON values', () => {
    expect(new JSONShape().parse('{"aaa":111}')).toEqual({ aaa: 111 });
  });

  test('raises an issue if an input is not a string', () => {
    expect(new JSONShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING }],
    });
  });

  test('raises an issue if an input cannot be parsed', () => {
    expect(new JSONShape().try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_JSON,
          path: [],
          input: 'aaa',
          message: 'Unexpected token a in JSON at position 0',
          param: 'Unexpected token a in JSON at position 0',
        },
      ],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new JSONShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, path: [], input: 111, param: TYPE_STRING, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('calls a reviver', () => {
    const reviverMock = jest.fn(() => 222);

    expect(new JSONShape().revive(reviverMock).parse('111')).toBe(222);
    expect(reviverMock).toHaveBeenCalledTimes(1);
  });
});
