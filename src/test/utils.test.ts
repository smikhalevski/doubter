import {
  cloneDict,
  cloneDictHead,
  cloneDictKeys,
  copyUnsafeChecks,
  createApplyChecksCallback,
  createIssueFactory,
  enableMask,
  getValueType,
  isEqual,
  isIterableObject,
  isMaskEnabled,
  isPlainObject,
  toArrayIndex,
  unique,
} from '../main/utils';
import { Issue, Shape, ValidationError } from '../main';

describe('isPlainObject', () => {
  test('detects plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject({ constructor: () => undefined })).toBe(true);
    expect(isPlainObject([1, 2, 3])).toBe(false);
    expect(isPlainObject(new (class {})())).toBe(false);
  });

  test('returns true for objects with a [[Prototype]] of null', () => {
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  test('returns false for non-Object objects', () => {
    expect(isPlainObject(Error)).toBe(false);
  });

  test('returns false for non-objects', () => {
    expect(isPlainObject(111)).toBe(false);
    expect(isPlainObject('aaa')).toBe(false);
  });
});

describe('getValueType', () => {
  test('returns value type', () => {
    expect(getValueType(111)).toBe('number');
    expect(getValueType('aaa')).toBe('string');
    expect(getValueType({})).toBe('object');
    expect(getValueType([])).toBe('array');
    expect(getValueType(null)).toBe('null');
    expect(getValueType(undefined)).toBe('undefined');
    expect(getValueType(new Date())).toBe('date');
  });
});

describe('isIterableObject', () => {
  test('returns value type', () => {
    expect(isIterableObject(new Map())).toBe(true);
    expect(isIterableObject(new Set())).toBe(true);
    expect(isIterableObject([])).toBe(true);
    expect(isIterableObject({ [Symbol.iterator]: 111 })).toBe(true);
    expect(isIterableObject({ [Symbol.iterator]: () => null })).toBe(true);
    expect(isIterableObject({ length: null })).toBe(true);
    expect(isIterableObject({ length: 111 })).toBe(true);
    expect(isIterableObject({ length: '111' })).toBe(true);
    expect(isIterableObject({ length: { valueOf: () => 111 } })).toBe(true);

    expect(isIterableObject({ length: undefined })).toBe(false);
    expect(isIterableObject({ length: 'aaa' })).toBe(false);
    expect(isIterableObject('')).toBe(false);
  });
});

describe('isEqual', () => {
  test('checks equality', () => {
    expect(isEqual(NaN, NaN)).toBe(true);
    expect(isEqual(0, -0)).toBe(true);
    expect(isEqual(111, 111)).toBe(true);

    expect(isEqual(111, 222)).toBe(false);
    expect(isEqual({}, {})).toBe(false);
  });
});

describe('toArrayIndex', () => {
  test('returns an array index', () => {
    expect(toArrayIndex('0')).toBe(0);
    expect(toArrayIndex('1')).toBe(1);
    expect(toArrayIndex('2')).toBe(2);

    expect(toArrayIndex(0)).toBe(0);
    expect(toArrayIndex(1)).toBe(1);
    expect(toArrayIndex(2)).toBe(2);
  });

  test('returns -1 if value is not an array index', () => {
    expect(toArrayIndex('-5')).toBe(-1);
    expect(toArrayIndex('0xa')).toBe(-1);
    expect(toArrayIndex('016')).toBe(-1);
    expect(toArrayIndex('000')).toBe(-1);
    expect(toArrayIndex('1e+49')).toBe(-1);
    expect(toArrayIndex(-111)).toBe(-1);
    expect(toArrayIndex(111.222)).toBe(-1);
    expect(toArrayIndex('aaa')).toBe(-1);
    expect(toArrayIndex(NaN)).toBe(-1);
    expect(toArrayIndex(new Date())).toBe(-1);
    expect(toArrayIndex({ valueOf: () => 2 })).toBe(-1);
    expect(toArrayIndex({ toString: () => '2' })).toBe(-1);
  });
});

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
    expect(shape['_checks']!.length).toBe(1);
    expect(shape['_checks']![0].callback).toBe(unsafeCheck);
  });
});

describe('createIssueFactory', () => {
  describe('known param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined, 'eee');

      expect(issueFactory('xxx', {})).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 'bbb',
          meta: undefined,
          param: 'eee',
          path: [],
        },
      ]);
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s', 'eee');

      expect(issueFactory('xxx', {})).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 'ccc eee',
          meta: undefined,
          param: 'eee',
          path: [],
        },
      ]);
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock, 'eee');

      expect(issueFactory('xxx', {})).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 222,
          meta: undefined,
          param: 'eee',
          path: [],
        },
      ]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', undefined, {});
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 }, 'eee');

      expect(issueFactory('xxx', {})).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 'ccc eee',
          meta: 111,
          param: 'eee',
          path: [],
        },
      ]);
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 }, 'eee');

      expect(issueFactory('xxx', {})).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 222,
          meta: 111,
          param: 'eee',
          path: [],
        },
      ]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', 111, {});
    });
  });

  describe('unknown param', () => {
    test('creates a factory with the default message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', undefined);

      expect(issueFactory('xxx', {}, 'eee')).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 'bbb',
          meta: undefined,
          param: 'eee',
          path: [],
        },
      ]);
    });

    test('creates a factory with a string message', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', 'ccc %s');

      expect(issueFactory('xxx', {}, 'eee')).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 'ccc eee',
          meta: undefined,
          param: 'eee',
          path: [],
        },
      ]);
    });

    test('creates a factory with a function message', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', cbMock);

      expect(issueFactory('xxx', {}, 'eee')).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 222,
          meta: undefined,
          param: 'eee',
          path: [],
        },
      ]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', undefined, {});
    });

    test('creates a factory with a string message in options', () => {
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: 'ccc %s', meta: 111 });

      expect(issueFactory('xxx', {}, 'eee')).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 'ccc eee',
          meta: 111,
          param: 'eee',
          path: [],
        },
      ]);
    });

    test('creates a factory with a function message in options', () => {
      const cbMock = jest.fn(() => 222);
      const issueFactory = createIssueFactory('aaa', 'bbb', { message: cbMock, meta: 111 });

      expect(issueFactory('xxx', { context: 333 }, 'eee')).toEqual([
        {
          code: 'aaa',
          input: 'xxx',
          message: 222,
          meta: 111,
          param: 'eee',
          path: [],
        },
      ]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 'eee', 'aaa', 'xxx', 111, { context: 333 });
    });
  });
});

describe('enableMask', () => {
  test('sets bit', () => {
    expect(enableMask(0b0, 5)).toBe(0b100000);
    expect(enableMask(0b1, 5)).toBe(0b100001);
    expect(enableMask(0b100, 5)).toBe(0b100100);
    expect(enableMask(0b1, 31)).toBe(-2147483647);
    expect(enableMask(0b1, 35)).toEqual([1, 0b1000, 0]);
  });
});

describe('isMaskEnabled', () => {
  test('reads bit', () => {
    expect(isMaskEnabled(enableMask(0b0, 5), 5)).toBe(true);
    expect(isMaskEnabled(enableMask(0b1, 5), 5)).toBe(true);
    expect(isMaskEnabled(enableMask(0b100, 5), 5)).toBe(true);
    expect(isMaskEnabled(enableMask(0b1, 31), 31)).toBe(true);
    expect(isMaskEnabled(enableMask(0b1, 35), 35)).toEqual(true);
  });
});

describe('cloneDict', () => {
  test('clones all keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneDict(obj1);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ aaa: 111, bbb: 222 });
  });
});

describe('cloneDictHead', () => {
  test('clones limited number of leading keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneDictHead(obj1, 1);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ aaa: 111 });
  });

  test('clones no keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneDictHead(obj1, 0);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({});
  });
});

describe('cloneDictKeys', () => {
  test('clones known keys', () => {
    const obj1 = { aaa: 111, bbb: 222 };
    const obj2 = cloneDictKeys(obj1, ['bbb']);

    expect(obj1).not.toBe(obj2);
    expect(obj2).toEqual({ bbb: 222 });
  });
});

describe('createApplyChecksCallback', () => {
  describe('arity 1', () => {
    test('returns issues', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, unsafe: false },
      ]);

      expect(applyChecks!(111, null, { verbose: false, coerced: false })).toEqual([{ code: 'xxx', path: [] }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    });

    test('unsafe check merges issues', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, unsafe: true },
      ]);

      const issues: Issue[] = [];

      expect(applyChecks!(111, issues, { verbose: false, coerced: false })).toEqual(issues);
      expect(issues).toEqual([{ code: 'xxx', path: [] }]);
      expect(cbMock).toHaveBeenCalledTimes(1);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
    });

    test('safe check is not called when issues present', () => {
      const cbMock = jest.fn(() => [{ code: 'xxx' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, unsafe: false },
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
        { key: cbMock, callback: cbMock, param: undefined, unsafe: false },
      ]);

      expect(() => applyChecks!(111, null, {})).toThrow(new Error('expected'));
    });

    test('extracts issues from ValidationError', () => {
      const cbMock = jest.fn(() => {
        throw new ValidationError([{ code: 'xxx' }]);
      });

      const applyChecks = createApplyChecksCallback([
        { key: cbMock, callback: cbMock, param: undefined, unsafe: false },
      ]);

      expect(applyChecks!(111, null, { verbose: false, coerced: false })).toEqual([{ code: 'xxx', path: [] }]);
    });
  });

  describe('arity N', () => {
    test('returns the first issue', () => {
      const cbMock1 = jest.fn(() => null);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock1, callback: cbMock1, param: undefined, unsafe: true },
        { key: cbMock2, callback: cbMock2, param: undefined, unsafe: true },
        { key: cbMock3, callback: cbMock3, param: undefined, unsafe: true },
        { key: cbMock4, callback: cbMock4, param: undefined, unsafe: true },
      ]);

      expect(applyChecks!(111, null, { verbose: false, coerced: false })).toEqual([{ code: 'BBB', path: [] }]);
      expect(cbMock1).toHaveBeenCalledTimes(1);
      expect(cbMock1).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(cbMock2).toHaveBeenCalledTimes(1);
      expect(cbMock2).toHaveBeenNthCalledWith(1, 111, { verbose: false, coerced: false });
      expect(cbMock3).not.toHaveBeenCalled();
      expect(cbMock4).not.toHaveBeenCalled();
    });

    test('returns the all issues in verbose mode', () => {
      const cbMock1 = jest.fn(() => null);
      const cbMock2 = jest.fn(() => [{ code: 'BBB' }]);
      const cbMock3 = jest.fn(() => [{ code: 'CCC' }]);
      const cbMock4 = jest.fn(() => [{ code: 'DDD' }]);

      const applyChecks = createApplyChecksCallback([
        { key: cbMock1, callback: cbMock1, param: undefined, unsafe: true },
        { key: cbMock2, callback: cbMock2, param: undefined, unsafe: true },
        { key: cbMock3, callback: cbMock3, param: undefined, unsafe: true },
        { key: cbMock4, callback: cbMock4, param: undefined, unsafe: true },
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
        { key: cbMock1, callback: cbMock1, param: undefined, unsafe: false },
        { key: cbMock2, callback: cbMock2, param: undefined, unsafe: true },
        { key: cbMock3, callback: cbMock3, param: undefined, unsafe: false },
        { key: cbMock4, callback: cbMock4, param: undefined, unsafe: true },
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
