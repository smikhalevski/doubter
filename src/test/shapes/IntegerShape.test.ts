import { IntegerShape } from '../../main';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  TYPE_INTEGER,
} from '../../main/shapes/constants';

describe('IntegerShape', () => {
  test('allows an integer', () => {
    expect(new IntegerShape().validate(111)).toBe(null);
  });

  test('raises if value is not an integer', () => {
    expect(new IntegerShape().validate(111.222)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111.222,
        param: TYPE_INTEGER,
        message: 'Must be an integer',
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().gt(2).validate(2)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 2,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().gt(2).validate(3)).toBe(null);
  });

  test('raises if value is not greater than or equal', () => {
    expect(new IntegerShape().gte(2).validate(1)).toEqual([
      {
        code: CODE_NUMBER_GTE,
        path: [],
        input: 1,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().gte(2).validate(2)).toBe(null);
  });

  test('raises if value is not less than', () => {
    expect(new IntegerShape().lt(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 3,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().lt(2).validate(2)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 2,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().lt(2).validate(1)).toBe(null);
  });

  test('raises if value is not less than or equal', () => {
    expect(new IntegerShape().lte(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LTE,
        path: [],
        input: 3,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().lte(2).validate(2)).toBe(null);
  });

  test('raises if value is not a multiple of', () => {
    expect(new IntegerShape().multipleOf(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_MULTIPLE_OF,
        path: [],
        input: 3,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new IntegerShape().multipleOf(2).validate(4)).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new IntegerShape({ message: 'xxx', meta: 'yyy' }).validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_INTEGER,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min issue', () => {
    expect(new IntegerShape().gt(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 0,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new IntegerShape().gte(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
      {
        code: CODE_NUMBER_GTE,
        path: [],
        input: 0,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for max issue', () => {
    expect(new IntegerShape().lt(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 3,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new IntegerShape().lte(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LTE,
        path: [],
        input: 3,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues', () => {
    expect(new IntegerShape().gt(2).multipleOf(3, { unsafe: true }).validate(1)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 1,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_NUMBER_MULTIPLE_OF,
        path: [],
        input: 1,
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in fast mode', () => {
    expect(new IntegerShape().gt(2).multipleOf(3).validate(1, { fast: true })).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 1,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });
});
