import { JSONShape } from '../../main';
import { CODE_JSON, MESSAGE_JSON } from '../../main/constants';

describe('JSONShape', () => {
  test('parses JSON values', () => {
    expect(new JSONShape().parse('{"aaa":111}')).toEqual({ aaa: 111 });
  });

  test('raises an issue if an input is not a string', () => {
    expect(new JSONShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_JSON, path: [], input: 111, param: undefined, message: MESSAGE_JSON }],
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
          param: new SyntaxError('Unexpected token a in JSON at position 0'),
          message: MESSAGE_JSON,
        },
      ],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new JSONShape({ message: 'aaa', meta: 'bbb' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_JSON, path: [], input: 111, param: undefined, message: 'aaa', meta: 'bbb' }],
    });
  });

  test('calls a reviver', () => {
    const reviverMock = jest.fn(() => 222);

    expect(new JSONShape().revive(reviverMock).parse('111')).toBe(222);
    expect(reviverMock).toHaveBeenCalledTimes(1);
  });
});
