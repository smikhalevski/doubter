import { IntegerType } from '../../main';

describe('IntegerType', () => {
  test('allows an integer', () => {
    expect(new IntegerType().validate(111)).toBe(null);
  });

  test('raises if value is not an integer', () => {
    expect(new IntegerType().validate(111.222)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111.222,
        param: 'integer',
        message: 'Must be an integer',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is not a number', () => {
    expect(new IntegerType().validate('111')).toEqual([
      {
        code: 'type',
        path: [],
        input: '111',
        param: 'integer',
        message: 'Must be an integer',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is NaN', () => {
    expect(new IntegerType().validate(NaN)).toEqual([
      {
        code: 'type',
        path: [],
        input: NaN,
        param: 'integer',
        message: 'Must be an integer',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is an instance of Number', () => {
    // noinspection JSPrimitiveTypeWrapperUsage
    expect(new IntegerType().validate(new Number(111))).toEqual([
      {
        code: 'type',
        path: [],
        input: new Number(111),
        param: 'integer',
        message: 'Must be an integer',
        meta: undefined,
      },
    ]);
  });

  test('raises if value is not greater than', () => {
    expect(new IntegerType().gt(2).validate(1)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 1,
        param: 2,
        message: 'Must be greater than 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().gt(2).validate(2)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 2,
        param: 2,
        message: 'Must be greater than 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().gt(2).validate(3)).toBe(null);
  });

  test('raises if value is not greater than or equal', () => {
    expect(new IntegerType().gte(2).validate(1)).toEqual([
      {
        code: 'numberGreaterThanOrEqual',
        path: [],
        input: 1,
        param: 2,
        message: 'Must be greater than or equal to 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().gte(2).validate(2)).toBe(null);
  });

  test('raises if value is not less than', () => {
    expect(new IntegerType().lt(2).validate(3)).toEqual([
      {
        code: 'numberLessThan',
        path: [],
        input: 3,
        param: 2,
        message: 'Must be less than 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().lt(2).validate(2)).toEqual([
      {
        code: 'numberLessThan',
        path: [],
        input: 2,
        param: 2,
        message: 'Must be less than 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().lt(2).validate(1)).toBe(null);
  });

  test('raises if value is not less than or equal', () => {
    expect(new IntegerType().lte(2).validate(3)).toEqual([
      {
        code: 'numberLessThanOrEqual',
        path: [],
        input: 3,
        param: 2,
        message: 'Must be less than or equal to 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().lte(2).validate(2)).toBe(null);
  });

  test('raises if value is not a multiple of', () => {
    expect(new IntegerType().multipleOf(2).validate(3)).toEqual([
      {
        code: 'numberMultipleOf',
        path: [],
        input: 3,
        param: 2,
        message: 'Must be a multiple of 2',
        meta: undefined,
      },
    ]);

    expect(new IntegerType().multipleOf(2).validate(4)).toBe(null);
  });

  test('overrides message for type issue', () => {
    expect(new IntegerType({ message: 'xxx', meta: 'yyy' }).validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'integer',
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });

  test('overrides message for min issue', () => {
    expect(new IntegerType().gt(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 0,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new IntegerType().gte(2, { message: 'xxx', meta: 'yyy' }).validate(0)).toEqual([
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
    expect(new IntegerType().lt(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
      {
        code: 'numberLessThan',
        path: [],
        input: 3,
        param: 2,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);

    expect(new IntegerType().lte(2, { message: 'xxx', meta: 'yyy' }).validate(3)).toEqual([
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
    expect(new IntegerType().gt(2).multipleOf(3).validate(1)).toEqual([
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
    expect(new IntegerType().gt(2).multipleOf(3).validate(1, { fast: true })).toEqual([
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
});
