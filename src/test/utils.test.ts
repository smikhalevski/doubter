import { createIssueFactory } from '../main/utils';

describe('createIssueFactory', () => {
  describe('known param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined, 'eee');

      expect(issueFactory('xxx', {})).toEqual({ code: 'aaa', input: 'xxx', message: 'bbb', param: 'eee' });
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s', 'eee');

      expect(issueFactory('xxx', {})).toEqual({ code: 'aaa', input: 'xxx', message: 'ccc eee', param: 'eee' });
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock, 'eee');

      expect(issueFactory('xxx', {})).toEqual({ code: 'aaa', input: 'xxx', message: 222, param: 'eee' });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(
        1,
        { code: 'aaa', input: 'xxx', message: 222, meta: undefined, param: 'eee', path: undefined },
        {}
      );
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 }, 'eee');

      expect(issueFactory('xxx', {})).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'ccc eee',
        meta: 111,
        param: 'eee',
      });
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 }, 'eee');

      expect(issueFactory('xxx', {})).toEqual({ code: 'aaa', input: 'xxx', message: 222, meta: 111, param: 'eee' });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(
        1,
        { code: 'aaa', input: 'xxx', message: 222, meta: 111, param: 'eee', path: undefined },
        {}
      );
    });
  });

  describe('unknown param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined);

      expect(issueFactory('xxx', {}, 'eee')).toEqual({ code: 'aaa', input: 'xxx', message: 'bbb', param: 'eee' });
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s');

      expect(issueFactory('xxx', {}, 'eee')).toEqual({ code: 'aaa', input: 'xxx', message: 'ccc eee', param: 'eee' });
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock);

      expect(issueFactory('xxx', {}, 'eee')).toEqual({ code: 'aaa', input: 'xxx', message: 222, param: 'eee' });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(
        1,
        { code: 'aaa', input: 'xxx', message: 222, meta: undefined, param: 'eee', path: undefined },
        {}
      );
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 });

      expect(issueFactory('xxx', {}, 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'ccc eee',
        meta: 111,
        param: 'eee',
      });
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 });

      expect(issueFactory('xxx', { context: 333 }, 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 222,
        meta: 111,
        param: 'eee',
      });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(
        1,
        { code: 'aaa', input: 'xxx', message: 222, meta: 111, param: 'eee', path: undefined },
        { context: 333 }
      );
    });
  });
});
