import { describe, expect, test } from 'vitest';
import { StringShape } from '../../main/index.js';
import {
  CODE_STRING_ENDS_WITH,
  CODE_STRING_INCLUDES,
  CODE_STRING_MAX,
  CODE_STRING_MIN,
  CODE_STRING_NON_BLANK,
  CODE_STRING_REGEX,
  CODE_STRING_STARTS_WITH,
  MESSAGE_STRING_NON_BLANK,
} from '../../main/constants.js';

describe('length', () => {
  test('raises if string length is not equal to', () => {
    expect(new StringShape().length(2).try('a')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'Must have the minimum length of 2' }],
    });
    expect(new StringShape().length(2).try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MAX, input: 'aaa', param: 2, message: 'Must have the maximum length of 2' }],
    });

    expect(new StringShape().length(2).parse('aa')).toBe('aa');
  });
});

describe('min', () => {
  test('raises if string length is not greater than', () => {
    expect(new StringShape().min(2).try('a')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'Must have the minimum length of 2' }],
    });

    expect(new StringShape().min(2).parse('aaa')).toBe('aaa');
  });

  test('overrides message', () => {
    expect(new StringShape().min(2, { message: 'xxx', meta: 'yyy' }).try('a')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: 'a', param: 2, message: 'xxx', meta: 'yyy' }],
    });
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

  test('overrides message', () => {
    expect(new StringShape().max(2, { message: 'xxx', meta: 'yyy' }).try('aaa')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MAX, input: 'aaa', param: 2, message: 'xxx', meta: 'yyy' }],
    });
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
});

describe('includes', () => {
  test('raises if string does not include a substring', () => {
    expect(new StringShape().includes('aaa').try('bbb')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_INCLUDES, input: 'bbb', param: 'aaa', message: 'Must include "aaa"' }],
    });

    expect(new StringShape().includes('aaa').parse('bbbaaabbb')).toBe('bbbaaabbb');
  });
});

describe('startsWith', () => {
  test('raises if string does not start with a substring', () => {
    expect(new StringShape().startsWith('aaa').try('bbb')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_STARTS_WITH, input: 'bbb', param: 'aaa', message: 'Must start with "aaa"' }],
    });

    expect(new StringShape().startsWith('aaa').parse('aaabbb')).toBe('aaabbb');
  });
});

describe('endsWith', () => {
  test('raises if string does not end with a substring', () => {
    expect(new StringShape().endsWith('aaa').try('bbb')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_ENDS_WITH, input: 'bbb', param: 'aaa', message: 'Must end with "aaa"' }],
    });

    expect(new StringShape().endsWith('aaa').parse('bbbaaa')).toBe('bbbaaa');
  });
});

describe('nonBlank', () => {
  test('raises if string contains only spaces', () => {
    expect(new StringShape().nonBlank().try(' \t\n ')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_NON_BLANK, input: ' \t\n ', message: MESSAGE_STRING_NON_BLANK }],
    });

    expect(new StringShape().nonBlank().parse('aaa')).toBe('aaa');
  });
});

describe('nonEmpty', () => {
  test('raises if string length is greater than 0', () => {
    expect(new StringShape().nonEmpty().try('')).toEqual({
      ok: false,
      issues: [{ code: CODE_STRING_MIN, input: '', param: 1, message: 'Must have the minimum length of 1' }],
    });

    expect(new StringShape().nonEmpty().parse('aaa')).toBe('aaa');
  });
});

describe('trim', () => {
  test('trims a string', () => {
    expect(new StringShape().trim().parse('  aaa  ')).toBe('aaa');
  });
});

describe('toLowerCase', () => {
  test('converts string to lower case', () => {
    expect(new StringShape().toLowerCase().parse('AAA')).toBe('aaa');
  });
});

describe('toUpperCase', () => {
  test('converts string to upper case', () => {
    expect(new StringShape().toUpperCase().parse('aaa')).toBe('AAA');
  });
});
