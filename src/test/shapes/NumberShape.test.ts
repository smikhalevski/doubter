import { NumberShape, ValidationError } from '../../main';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_DIVISOR,
  CODE_TYPE,
  TYPE_NUMBER,
} from '../../main/shapes/constants';

describe('NumberShape', () => {
  test('allows a number', () => {
    expect(new NumberShape().validate(111)).toBe(null);
  });

  test('raises if value is not a number', () => {
    expect(new NumberShape().validate('111')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: '111',
        param: TYPE_NUMBER,
        message: 'Must be a number',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().validate(NaN)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: NaN,
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new NumberShape().gt(2).validate(3)).toBe(null);
  });

  test('raises if value is not an infinity', () => {
    expect(new NumberShape().validate(Infinity)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: Infinity,
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises if value is not greater than or equal', () => {
    expect(new NumberShape().gte(2).validate(1)).toEqual([
      {
        code: CODE_NUMBER_GTE,
        path: [],
        input: 1,
        param: 2,
        message: 'Must be greater than or equal to 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().gte(2).validate(2)).toBe(null);
  });

  test('raises if value is not less than', () => {
    expect(new NumberShape().lt(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 3,
        param: 2,
        message: 'Must be less than 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lt(2).validate(2)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 2,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lt(2).validate(1)).toBe(null);
  });

  test('raises if value is not less than or equal', () => {
    expect(new NumberShape().lte(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LTE,
        path: [],
        input: 3,
        param: 2,
        message: 'Must be less than or equal to 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lte(2).validate(2)).toBe(null);
  });

  test('raises if value is not a multiple of', () => {
    expect(new NumberShape().divisor(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_DIVISOR,
        path: [],
        input: 3,
        param: 2,
        message: 'Must be a multiple of 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().divisor(2).validate(4)).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new NumberShape({ message: 'xxx', meta: 'yyy' }).validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min issue', () => {
    expect(new NumberShape().gt(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 0,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new NumberShape().gte(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
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
    expect(new NumberShape().lt(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 3,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new NumberShape().lte(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
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

  test('raises multiple issues in verbose mode', () => {
    expect(new NumberShape().gt(2).divisor(3, { unsafe: true }).validate(1, { verbose: true })).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 1,
        param: 2,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_NUMBER_DIVISOR,
        path: [],
        input: 1,
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue', () => {
    expect(new NumberShape().gt(2).divisor(3, { unsafe: true }).validate(1)).toEqual([
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

  test('applies constraints', () => {
    const constrainMock = jest.fn(value => {
      throw new ValidationError([{ code: 'zzz' }]);
    });

    expect(new NumberShape().constrain(constrainMock).validate(111)).toEqual([
      {
        code: 'zzz',
        path: [],
        input: undefined,
        param: undefined,
        message: undefined,
        meta: undefined,
      },
    ]);

    expect(constrainMock).toHaveBeenCalledTimes(1);
    expect(constrainMock).toHaveBeenNthCalledWith(1, 111, undefined);
  });

  test('supports async validation', async () => {
    expect(await new NumberShape().gt(3).validateAsync(2)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 2,
        param: 3,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });
});
