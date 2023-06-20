import { NEVER, StringShape } from '../../main';
import {
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_REGEX,
  CODE_TYPE,
  MESSAGE_STRING_TYPE,
} from '../../main/constants';
import { TYPE_ARRAY, TYPE_BIGINT, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../../main/Type';

describe('StringShape', () => {
  test('creates a string shape', () => {
    const shape = new StringShape();

    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([TYPE_STRING]);
  });

  test('allows a string', () => {
    expect(new StringShape().parse('aaa')).toBe('aaa');
  });

  test('raises if value is not a string', () => {
    expect(new StringShape().try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_STRING, message: 'Must be a string' }],
    });

    expect(new StringShape().min(2).parse('aaa')).toBe('aaa');
  });

  test('overrides message for type issue', () => {
    expect(new StringShape({ message: 'xxx', meta: 'yyy' }).try(111)).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: 111, param: TYPE_STRING, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('overrides message for min length issue', () => {
    expect(new StringShape().min(2, { message: 'xxx', meta: 'yyy' }).try('a')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('overrides message for max length issue', () => {
    expect(new StringShape().max(2, { message: 'xxx', meta: 'yyy' }).try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MAX, input: 'aaa', param: 2, message: 'xxx', meta: 'yyy' }],
    });
  });

  test('raises multiple issues in verbose mode', () => {
    expect(new StringShape({}).min(3).regex(/aaaa/).try('aa', { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_STRING_MIN, input: 'aa', param: 3, message: 'Must have the minimum length of 3' },
        { code: CODE_STRING_REGEX, input: 'aa', param: /aaaa/, message: 'Must match the pattern /aaaa/' },
      ],
    });
  });

  test('raises a single issue', () => {
    expect(new StringShape().min(3).regex(/aaaa/).try('aa')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'aa', param: 3, message: 'Must have the minimum length of 3' }],
    });
  });

  test('applies checks', () => {
    const shape = new StringShape().check(() => [{ code: 'xxx' }]);

    expect(shape.try('')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('updates inputs when coerced', () => {
    const shape = new StringShape().coerce();

    expect(shape.inputs).toEqual([
      TYPE_STRING,
      TYPE_OBJECT,
      TYPE_NUMBER,
      TYPE_BOOLEAN,
      TYPE_BIGINT,
      TYPE_ARRAY,
      null,
      undefined,
    ]);
  });

  test('coerces an input', () => {
    expect(new StringShape().coerce().parse(111)).toBe('111');
    expect(new StringShape().coerce().parse(true)).toBe('true');
    expect(new StringShape().coerce().parse(['aaa'])).toBe('aaa');
    expect(new StringShape().parse(['aaa'], { coerce: true })).toBe('aaa');
  });

  test('raises an issue if coercion fails', () => {
    expect(new StringShape().coerce().try([111, 222])).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: [111, 222], message: MESSAGE_STRING_TYPE, param: TYPE_STRING }],
    });
  });

  describe('coercion', () => {
    test('coerces a String wrapper', () => {
      expect(new StringShape()['_coerce'](String('aaa'))).toBe('aaa');
      expect(new StringShape()['_coerce']([String('aaa')])).toBe('aaa');
    });

    test('coerces a number', () => {
      expect(new StringShape()['_coerce'](111)).toBe('111');
      expect(new StringShape()['_coerce'](111.222)).toBe('111.222');

      expect(new StringShape()['_coerce'](NaN)).toBe(NEVER);
      expect(new StringShape()['_coerce'](Infinity)).toBe(NEVER);
      expect(new StringShape()['_coerce'](-Infinity)).toBe(NEVER);
    });

    test('coerces a boolean', () => {
      expect(new StringShape()['_coerce'](true)).toBe('true');
      expect(new StringShape()['_coerce'](false)).toBe('false');
    });

    test('coerces null and undefined values', () => {
      expect(new StringShape()['_coerce'](null)).toBe('');
      expect(new StringShape()['_coerce'](undefined)).toBe('');
    });

    test('coerces an array with a single string element', () => {
      expect(new StringShape()['_coerce'](['aaa'])).toBe('aaa');
      expect(new StringShape()['_coerce']([111])).toBe('111');

      expect(new StringShape()['_coerce']([['aaa']])).toBe(NEVER);
      expect(new StringShape()['_coerce']([[111]])).toBe(NEVER);
      expect(new StringShape()['_coerce'](['aaa', 'bbb'])).toBe(NEVER);
      expect(new StringShape()['_coerce'](['aaa', 111])).toBe(NEVER);
    });

    test('does not coerce objects and functions', () => {
      expect(new StringShape()['_coerce']({ key1: 111 })).toBe(NEVER);
      expect(new StringShape()['_coerce'](() => undefined)).toBe(NEVER);
    });

    test('does not coerce a symbol', () => {
      expect(new StringShape()['_coerce'](Symbol())).toBe(NEVER);
    });
  });
});
