import { Issue, Shape, ValidationError } from '../../main';
import { copyUnsafeChecks, createApplyChecksCallback, createIssueFactory } from '../../main/utils';

describe('copyUnsafeChecks', () => {
  test('returns the exact copy of the target shape is there are no unsafe check on the source shape', () => {
    const sourceShape = new Shape().check(() => undefined);
    const targetShape = new Shape();

    expect(copyUnsafeChecks(sourceShape, targetShape)).toEqual(targetShape);
  });

  test('copies unsafe checks from source to a target clone', () => {
    const safeCheck = () => undefined;
    const unsafeCheck = () => undefined;

    const sourceShape = new Shape().check(safeCheck).check(unsafeCheck, { unsafe: true });
    const targetShape = new Shape();

    const shape = copyUnsafeChecks(sourceShape, targetShape);

    expect(shape).not.toBe(targetShape);
    expect(shape['_checks'].length).toBe(1);
    expect(shape['_checks'][0].callback).toBe(unsafeCheck);
  });
});

describe('createIssueFactory', () => {
  describe('known param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined, 'eee');

      expect(issueFactory('xxx', {})).toEqual([{ code: 'aaa', input: 'xxx', message: 'bbb', param: 'eee' }]);
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s', 'eee');

      expect(issueFactory('xxx', {})).toEqual([{ code: 'aaa', input: 'xxx', message: 'ccc eee', param: 'eee' }]);
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock, 'eee');

      expect(issueFactory('xxx', {})).toEqual([{ code: 'aaa', input: 'xxx', message: 222, param: 'eee' }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', undefined, {});
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 }, 'eee');

      expect(issueFactory('xxx', {})).toEqual([
        { code: 'aaa', input: 'xxx', message: 'ccc eee', meta: 111, param: 'eee' },
      ]);
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 }, 'eee');

      expect(issueFactory('xxx', {})).toEqual([{ code: 'aaa', input: 'xxx', message: 222, meta: 111, param: 'eee' }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', 111, {});
    });
  });

  describe('unknown param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined);

      expect(issueFactory('xxx', {}, 'eee')).toEqual([{ code: 'aaa', input: 'xxx', message: 'bbb', param: 'eee' }]);
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s');

      expect(issueFactory('xxx', {}, 'eee')).toEqual([{ code: 'aaa', input: 'xxx', message: 'ccc eee', param: 'eee' }]);
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock);

      expect(issueFactory('xxx', {}, 'eee')).toEqual([{ code: 'aaa', input: 'xxx', message: 222, param: 'eee' }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', undefined, {});
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 });

      expect(issueFactory('xxx', {}, 'eee')).toEqual([
        { code: 'aaa', input: 'xxx', message: 'ccc eee', meta: 111, param: 'eee' },
      ]);
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 });

      expect(issueFactory('xxx', { context: 333 }, 'eee')).toEqual([
        { code: 'aaa', input: 'xxx', message: 222, meta: 111, param: 'eee' },
      ]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', 111, { context: 333 });
    });
  });
});

describe('createApplyChecksCallback', () => {
  describe('arity 1', () => {
    test('returns issues', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, isUnsafe: false },
      ]);

      expect(applyChecks!(111, null, { verbose: false, coerced: false })).toEqual([{ code: 'xxx' }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
    });

    test('unsafe check merges issues', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, isUnsafe: true },
      ]);

      const issues: Issue[] = [];

      expect(applyChecks!(111, issues, { verbose: false, coerced: false })).toEqual(issues);
      expect(issues).toEqual([{ code: 'xxx' }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
    });

    test('safe check is not called when issues present', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, isUnsafe: false },
      ]);

      const issues: Issue[] = [];

      expect(applyChecks!(111, issues, { verbose: false, coerced: false })).toEqual(issues);
      expect(issues.length).toBe(0);
      expect(cbMock).not.toHaveBeenCalled();
    });

    test('does not swallow unknown error', () => {
      const cbMock = jest.fn(() => {
        throw new Error('expected');
      });

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, isUnsafe: false },
      ]);

      expect(() => applyChecks!(111, null, {})).toThrow(new Error('expected'));
    });

    test('extracts issues from ValidationError', () => {
      const cbMock = jest.fn(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, isUnsafe: false },
      ]);

      expect(applyChecks!(111, null, { verbose: false, coerced: false })).toEqual([{ code: 'xxx' }]);
    });
  });

  describe('arity N', () => {
    test('returns the first issue', () => {
      const cbMock1 = jest.fn(() => null);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock1, callback: cbMock1, param: undefined, isUnsafe: true },
        { key: cbMock2, callback: cbMock2, param: undefined, isUnsafe: true },
        { key: cbMock3, callback: cbMock3, param: undefined, isUnsafe: true },
        { key: cbMock4, callback: cbMock4, param: undefined, isUnsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: false, coerced: false })).toEqual([{ code: 'BBB' }]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerced: false });
      expect(cbMock3).not.toHaveBeenCalled();
      expect(cbMock4).not.toHaveBeenCalled();
    });

    test('returns the all issues in verbose mode', () => {
      const cbMock1 = jest.fn(() => null);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock1, callback: cbMock1, param: undefined, isUnsafe: true },
        { key: cbMock2, callback: cbMock2, param: undefined, isUnsafe: true },
        { key: cbMock3, callback: cbMock3, param: undefined, isUnsafe: true },
        { key: cbMock4, callback: cbMock4, param: undefined, isUnsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: true })).toEqual([{ code: 'BBB' }, { code: 'CCC' }, { code: 'DDD' }]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
      expect(cbMock3).toHaveBeenCalledTimes(1);
      expect(cbMock3).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
      expect(cbMock4).toHaveBeenCalledTimes(1);
      expect(cbMock4).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
    });

    test('does not execute unsafe checks', () => {
      const cbMock1 = jest.fn(() => [{ code: 'AAA' }]);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock1, callback: cbMock1, param: undefined, isUnsafe: false },
        { key: cbMock2, callback: cbMock2, param: undefined, isUnsafe: true },
        { key: cbMock3, callback: cbMock3, param: undefined, isUnsafe: false },
        { key: cbMock4, callback: cbMock4, param: undefined, isUnsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: true })).toEqual([{ code: 'AAA' }, { code: 'BBB' }, { code: 'DDD' }]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
      expect(cbMock3).not.toHaveBeenCalled();
      expect(cbMock4).toHaveBeenCalledTimes(1);
      expect(cbMock4).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: true });
    });
  });
});
