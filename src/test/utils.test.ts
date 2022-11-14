import {
  cloneEnumerableKeys,
  cloneKnownKeys,
  createApplyChecksCallback,
  createIssueFactory,
  isEqual,
  isFlagSet,
  setFlag,
  unique,
} from '../main/utils';
import { Issue, ValidationError } from '../main';

describe('isEqual', () => {
  test('checks equality', () => {
    expect(isEqual(NaN, NaN)).toBe(true);
    expect(isEqual(0, -0)).toBe(true);
    expect(isEqual(111, 111)).toBe(true);

    expect(isEqual(111, 222)).toBe(false);
    expect(isEqual({}, {})).toBe(false);
  });
});

describe('unique', () => {
  test('returns the input array if it contains unique values', () => {
    const arr = [1, 2, 3];
    expect(unique(arr)).toBe(arr);
  });

  test('returns the empty array as is', () => {
    const arr: any[] = [];
    expect(unique(arr)).toBe(arr);
  });

  test('removes duplicates', () => {
    const arr = [1, 2, 3, 3, 1];
    const uniqueArr = unique(arr);

    expect(uniqueArr).not.toBe(arr);
    expect(uniqueArr).toEqual([2, 3, 1]);
  });

  test('removes NaN duplicates', () => {
    const arr = [NaN, 1, NaN, 2, NaN];
    const uniqueArr = unique(arr);

    expect(uniqueArr).not.toBe(arr);
    expect(uniqueArr).toEqual([1, 2, NaN]);
  });
});

describe('createIssueFactory', () => {
  describe('known param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined, 'eee');

      expect(issueFactory('xxx')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'bbb',
        meta: undefined,
        param: 'eee',
        path: [],
      });
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s', 'eee');

      expect(issueFactory('xxx')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'ccc eee',
        meta: undefined,
        param: 'eee',
        path: [],
      });
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock, 'eee');

      expect(issueFactory('xxx')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 222,
        meta: undefined,
        param: 'eee',
        path: [],
      });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', undefined);
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 }, 'eee');

      expect(issueFactory('xxx')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'ccc eee',
        meta: 111,
        param: 'eee',
        path: [],
      });
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 }, 'eee');

      expect(issueFactory('xxx')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 222,
        meta: 111,
        param: 'eee',
        path: [],
      });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', 111);
    });
  });

  describe('unknown param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined);

      expect(issueFactory('xxx', 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'bbb',
        meta: undefined,
        param: 'eee',
        path: [],
      });
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s');

      expect(issueFactory('xxx', 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'ccc eee',
        meta: undefined,
        param: 'eee',
        path: [],
      });
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock);

      expect(issueFactory('xxx', 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 222,
        meta: undefined,
        param: 'eee',
        path: [],
      });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', undefined);
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 });

      expect(issueFactory('xxx', 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 'ccc eee',
        meta: 111,
        param: 'eee',
        path: [],
      });
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 });

      expect(issueFactory('xxx', 'eee')).toEqual({
        code: 'aaa',
        input: 'xxx',
        message: 222,
        meta: 111,
        param: 'eee',
        path: [],
      });
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', 111);
    });
  });
});

describe('setFlag', () => {
  test('sets bit', () => {
    expect(setFlag(0b0, 5)).toBe(0b100000);
    expect(setFlag(0b1, 5)).toBe(0b100001);
    expect(setFlag(0b100, 5)).toBe(0b100100);
    expect(setFlag(0b1, 31)).toBe(-2147483647);
    expect(setFlag(0b1, 35)).toEqual([1, 0b1000, 0]);
  });
});

describe('isFlagSet', () => {
  test('reads bit', () => {
    expect(isFlagSet(setFlag(0b0, 5), 5)).toBe(true);
    expect(isFlagSet(setFlag(0b1, 5), 5)).toBe(true);
    expect(isFlagSet(setFlag(0b100, 5), 5)).toBe(true);
    expect(isFlagSet(setFlag(0b1, 31), 31)).toBe(true);
    expect(isFlagSet(setFlag(0b1, 35), 35)).toEqual(true);
  });
});

describe('cloneEnumerableKeys', () => {
  test('clones all keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneEnumerableKeys(obj1);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ aaa: 111, bbb: 222 });
  });

  test('clones limited number of leading keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneEnumerableKeys(obj1, 1);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ aaa: 111 });
  });

  test('clones no keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneEnumerableKeys(obj1, 0);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({});
  });
});

describe('cloneKnownKeys', () => {
  test('clones known keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneKnownKeys(obj1, ['bbb']);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ bbb: 222 });
  });
});

describe('createApplyChecksCallback', () => {
  describe('arity 1', () => {
    test('returns issues', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock, param: undefined, key: 'aaa', unsafe: false },
      ]);

      expect(applyChecks!(111, null, { verbose: false })).toEqual([{ code: 'xxx', path: [] }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, { verbose: false });
    });

    test('unsafe check merges issues', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([{ callback: cbMock, param: undefined, key: 'aaa', unsafe: true }]);

      const issues: Issue[] = [];

      expect(applyChecks!(111, issues, { verbose: false })).toEqual(issues);
      expect(issues).toEqual([{ code: 'xxx', path: [] }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, { verbose: false });
    });

    test('safe check is not called when issues present', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock, param: undefined, key: 'aaa', unsafe: false },
      ]);

      const issues: Issue[] = [];

      expect(applyChecks!(111, issues, { verbose: false })).toEqual(issues);
      expect(issues.length).toBe(0);
      expect(cbMock).not.toHaveBeenCalled();
    });

    test('does not swallow unknown error', () => {
      const cbMock = jest.fn(() => {
        throw new Error('expected');
      });

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock, param: undefined, key: 'aaa', unsafe: false },
      ]);

      expect(() => applyChecks!(111, null, {})).toThrow(new Error('expected'));
    });

    test('extracts issues from ValidationError', () => {
      const cbMock = jest.fn(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock, param: undefined, key: 'aaa', unsafe: false },
      ]);

      expect(applyChecks!(111, null, { verbose: false })).toEqual([{ code: 'xxx', path: [] }]);
    });
  });

  describe('arity N', () => {
    test('returns the first issue', () => {
      const cbMock1 = jest.fn(() => null);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock1, param: undefined, key: 'aaa', unsafe: true },
        { callback: cbMock2, param: undefined, key: 'bbb', unsafe: true },
        { callback: cbMock3, param: undefined, key: 'ccc', unsafe: true },
        { callback: cbMock4, param: undefined, key: 'ddd', unsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: false })).toEqual([{ code: 'BBB', path: [] }]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, { verbose: false });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, { verbose: false });
      expect(cbMock3).not.toHaveBeenCalled();
      expect(cbMock4).not.toHaveBeenCalled();
    });

    test('returns the all issues in verbose mode', () => {
      const cbMock1 = jest.fn(() => null);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock1, param: undefined, key: 'aaa', unsafe: true },
        { callback: cbMock2, param: undefined, key: 'bbb', unsafe: true },
        { callback: cbMock3, param: undefined, key: 'ccc', unsafe: true },
        { callback: cbMock4, param: undefined, key: 'ddd', unsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: true })).toEqual([
        { code: 'BBB', path: [] },
        { code: 'CCC', path: [] },
        { code: 'DDD', path: [] },
      ]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, { verbose: true });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, { verbose: true });
      expect(cbMock3).toHaveBeenCalledTimes(1);
      expect(cbMock3).toHaveBeenNthCalledWith(1, 111, { verbose: true });
      expect(cbMock4).toHaveBeenCalledTimes(1);
      expect(cbMock4).toHaveBeenNthCalledWith(1, 111, { verbose: true });
    });

    test('does not execute unsafe checks', () => {
      const cbMock1 = jest.fn(() => [{ code: 'AAA' }]);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { callback: cbMock1, param: undefined, key: 'aaa', unsafe: false },
        { callback: cbMock2, param: undefined, key: 'bbb', unsafe: true },
        { callback: cbMock3, param: undefined, key: 'ccc', unsafe: false },
        { callback: cbMock4, param: undefined, key: 'ddd', unsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: true })).toEqual([
        { code: 'AAA', path: [] },
        { code: 'BBB', path: [] },
        { code: 'DDD', path: [] },
      ]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, { verbose: true });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, { verbose: true });
      expect(cbMock3).not.toHaveBeenCalled();
      expect(cbMock4).toHaveBeenCalledTimes(1);
      expect(cbMock4).toHaveBeenNthCalledWith(1, 111, { verbose: true });
    });
  });
});
