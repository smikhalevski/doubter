import { describe, expect, test } from 'vitest';
import { createIssue } from '../main/utils.js';

describe('createIssue', () => {
  test('uses the default message', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, {}, undefined)).toEqual({
      code: 'xxx',
      input: 111,
      message: 'aaa',
      meta: undefined,
      param: 222,
      path: undefined,
    });
  });

  test('uses the string message from apply options', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, { messages: { xxx: 'bbb' } }, undefined)).toEqual({
      code: 'xxx',
      input: 111,
      message: 'bbb',
      meta: undefined,
      param: 222,
      path: undefined,
    });
  });

  test('uses the function message from apply options', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, { messages: { xxx: () => 'bbb' } }, undefined)).toEqual({
      code: 'xxx',
      input: 111,
      message: 'bbb',
      meta: undefined,
      param: 222,
      path: undefined,
    });
  });

  test('uses string issue options as a message', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, { messages: { xxx: 'bbb' } }, 'ccc')).toEqual({
      code: 'xxx',
      input: 111,
      message: 'ccc',
      meta: undefined,
      param: 222,
      path: undefined,
    });
  });

  test('uses function issue options as a message', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, { messages: { xxx: 'bbb' } }, () => 'ccc')).toEqual({
      code: 'xxx',
      input: 111,
      message: 'ccc',
      meta: undefined,
      param: 222,
      path: undefined,
    });
  });

  test('uses message and meta from issue options', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, { messages: { xxx: 'bbb' } }, { message: 'ccc', meta: 'ddd' })).toEqual({
      code: 'xxx',
      input: 111,
      message: 'ccc',
      meta: 'ddd',
      param: 222,
      path: undefined,
    });
  });

  test('uses the default message if issue options do not have a message', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, {}, { meta: 'ddd' })).toEqual({
      code: 'xxx',
      input: 111,
      message: 'aaa',
      meta: 'ddd',
      param: 222,
      path: undefined,
    });
  });

  test('uses the message from apply options if issue options do not have a message', () => {
    expect(createIssue('xxx', 111, 'aaa', 222, { messages: { xxx: 'bbb' } }, { meta: 'ddd' })).toEqual({
      code: 'xxx',
      input: 111,
      message: 'bbb',
      meta: 'ddd',
      param: 222,
      path: undefined,
    });
  });
});
