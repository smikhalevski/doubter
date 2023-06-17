import { StringShape } from '../../main';
import { CODE_STRING_MAX, CODE_STRING_MIN, CODE_STRING_REGEX } from '../../main/constants';

describe('length', () => {});

describe('min', () => {
  test('raises if string length is not greater than', () => {
    expect(new StringShape().min(2).try('a')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'Must have the minimum length of 2' }],
    });

    expect(new StringShape().min(2).parse('aaa')).toBe('aaa');
  });
});

describe('max', () => {
  test('raises if string length is not less than', () => {
    expect(new StringShape().max(2).try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MAX, input: 'aaa', param: 2, message: 'Must have the maximum length of 2' }],
    });

    expect(new StringShape().max(3).parse('aaa')).toBe('aaa');
  });
});

describe('regex', () => {
  test('raises if string does not match a pattern', () => {
    expect(new StringShape().regex(/a+/).try('bbb')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_REGEX, input: 'bbb', param: /a+/, message: 'Must match the pattern /a+/' }],
    });

    expect(new StringShape().regex(/a+/).parse('aaa')).toBe('aaa');
  });

  test('raises if string does not match multiple a patterns', () => {
    expect(new StringShape().regex(/a+/).regex(/b+/).try('ccc', { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_STRING_REGEX, input: 'ccc', message: 'Must match the pattern /a+/', param: /a+/ },
        { code: CODE_STRING_REGEX, input: 'ccc', message: 'Must match the pattern /b+/', param: /b+/ },
      ],
    });
  });

  test('same regexp is added only once', () => {
    expect(new StringShape().regex(/a+/).regex(/a+/).try('bbb', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_REGEX, input: 'bbb', message: 'Must match the pattern /a+/', param: /a+/ }],
    });
  });
});
