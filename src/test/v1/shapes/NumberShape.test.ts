import { NumberShape, StringShape } from '../../../main';
import { ValidationError } from '../../../main/v1/ValidationError';

describe('NumberShape', () => {
  test('allows a number', () => {
    expect(new NumberShape().validate(111)).toBe(null);
  });

  test('raises if value is not a number', () => {
    expect(new NumberShape().validate('111')).toEqual([
      {
        code: 'type',
        path: [],
        input: '111',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is NaN', () => {
    expect(new NumberShape().validate(NaN)).toEqual([
      {
        code: 'type',
        path: [],
        input: NaN,
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is an instance of Number', () => {
    // noinspection JSPrimitiveTypeWrapperUsage
    expect(new NumberShape().validate(new Number(111))).toEqual([
      {
        code: 'type',
        path: [],
        input: new Number(111),
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is not greater than', () => {
    expect(new NumberShape().gt(2).validate(1)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 1,
        param: 2,
        message: 'Must be greater than 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().gt(2).validate(2)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 2,
        param: 2,
        message: 'Must be greater than 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().gt(2).validate(3)).toBe(null);
  });

  test('raises if value is not greater than or equal', () => {
    expect(new NumberShape().gte(2).validate(1)).toEqual([
      {
        code: 'numberGreaterThanOrEqual',
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
        code: 'numberLessThan',
        path: [],
        input: 3,
        param: 2,
        message: 'Must be less than 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lt(2).validate(2)).toEqual([
      {
        code: 'numberLessThan',
        path: [],
        input: 2,
        param: 2,
        message: 'Must be less than 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().lt(2).validate(1)).toBe(null);
  });

  test('raises if value is not less than or equal', () => {
    expect(new NumberShape().lte(2).validate(3)).toEqual([
      {
        code: 'numberLessThanOrEqual',
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
    expect(new NumberShape().multipleOf(2).validate(3)).toEqual([
      {
        code: 'numberMultipleOf',
        path: [],
        input: 3,
        param: 2,
        message: 'Must be a multiple of 2',
        meta: undefined,
      },
    ]);

    expect(new NumberShape().multipleOf(2).validate(4)).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new NumberShape({ message: 'xxx', meta: 'yyy' }).validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'number',
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min issue', () => {
    expect(new NumberShape().gt(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 0,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new NumberShape().gte(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
      {
        code: 'numberGreaterThanOrEqual',
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
        code: 'numberLessThan',
        path: [],
        input: 3,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new NumberShape().lte(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
      {
        code: 'numberLessThanOrEqual',
        path: [],
        input: 3,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('raises multiple issues', () => {
    expect(new NumberShape().gt(2).multipleOf(3).validate(1)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 1,
        param: 2,
        message: 'Must be greater than 2',
        meta: undefined,
      },
      {
        code: 'numberMultipleOf',
        path: [],
        input: 1,
        param: 3,
        message: 'Must be a multiple of 3',
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue in fast mode', () => {
    expect(new NumberShape().gt(2).multipleOf(3).validate(1, { fast: true })).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 1,
        param: 2,
        message: 'Must be greater than 2',
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
    expect(constrainMock).toHaveBeenNthCalledWith(1, 111);
  });

  test('supports async validation', async () => {
    expect(await new NumberShape().gt(3).validateAsync(2)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 2,
        param: 3,
        message: 'Must be greater than 3',
        meta: undefined,
      },
    ]);
  });
});
