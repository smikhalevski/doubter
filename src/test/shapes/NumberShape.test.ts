import { NumberShape, ValidationError } from '../../main';
import {
  CODE_NUMBER_GT,
  CODE_NUMBER_GTE,
  CODE_NUMBER_LT,
  CODE_NUMBER_LTE,
  CODE_NUMBER_MULTIPLE_OF,
  CODE_TYPE,
  MESSAGE_NUMBER_GT,
  MESSAGE_NUMBER_GTE,
  MESSAGE_NUMBER_LT,
  MESSAGE_NUMBER_LTE,
  MESSAGE_NUMBER_MULTIPLE_OF,
  MESSAGE_NUMBER_TYPE,
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
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if value is NaN', () => {
    expect(new NumberShape().validate(NaN)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: NaN,
        param: TYPE_NUMBER,
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if value is an instance of Number', () => {
    // noinspection JSPrimitiveTypeWrapperUsage
    expect(new NumberShape().validate(new Number(111))).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: new Number(111),
        param: TYPE_NUMBER,
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if value is not greater than', () => {
    expect(new NumberShape().gt(2).validate(1)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 1,
        param: 2,
        message: MESSAGE_NUMBER_GT + 2,
        meta: undefined,
      },
    ]);

    expect(new NumberShape().gt(2).validate(2)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 2,
        param: 2,
        message: MESSAGE_NUMBER_GT + 2,
        meta: undefined,
      },
    ]);

    expect(new NumberShape().gt(2).validate(3)).toBe(null);
  });

  test('raises if value is not greater than or equal', () => {
    expect(new NumberShape().gte(2).validate(1)).toEqual([
      {
        code: CODE_NUMBER_GTE,
        path: [],
        input: 1,
        param: 2,
        message: MESSAGE_NUMBER_GTE + 2,
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
        message: MESSAGE_NUMBER_LT + 2,
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lt(2).validate(2)).toEqual([
      {
        code: CODE_NUMBER_LT,
        path: [],
        input: 2,
        param: 2,
        message: MESSAGE_NUMBER_LT + 2,
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
        message: MESSAGE_NUMBER_LTE + 2,
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lte(2).validate(2)).toBe(null);
  });

  test('raises if value is not a multiple of', () => {
    expect(new NumberShape().multipleOf(2).validate(3)).toEqual([
      {
        code: CODE_NUMBER_MULTIPLE_OF,
        path: [],
        input: 3,
        param: 2,
        message: MESSAGE_NUMBER_MULTIPLE_OF + 2,
        meta: undefined,
      },
    ]);

    expect(new NumberShape().multipleOf(2).validate(4)).toBe(null);
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

  test('raises multiple issues', () => {
    expect(new NumberShape().gt(2).multipleOf(3, { unsafe: true }).validate(1)).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 1,
        param: 2,
        message: MESSAGE_NUMBER_GT + 2,
        meta: undefined,
      },
      {
        code: CODE_NUMBER_MULTIPLE_OF,
        path: [],
        input: 1,
        param: 3,
        message: MESSAGE_NUMBER_MULTIPLE_OF + 3,
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in fast mode', () => {
    expect(new NumberShape().gt(2).multipleOf(3).validate(1, { fast: true })).toEqual([
      {
        code: CODE_NUMBER_GT,
        path: [],
        input: 1,
        param: 2,
        message: MESSAGE_NUMBER_GT + 2,
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
        message: MESSAGE_NUMBER_GT + 3,
        meta: undefined,
      },
    ]);
  });
});
