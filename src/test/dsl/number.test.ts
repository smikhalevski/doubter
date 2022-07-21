import { number } from '../../main';

describe('number', () => {
  test('allows a number', () => {
    expect(number().validate(111)).toEqual([]);
  });

  test('raises if value is not a number', () => {
    expect(number().validate(NaN)).toEqual([
      {
        code: 'type',
        path: [],
        input: NaN,
        param: 'number',
      },
    ]);

    expect(number().validate('111')).toEqual([
      {
        code: 'type',
        path: [],
        input: '111',
        param: 'number',
      },
    ]);
  });

  test('raises if value is not greater than', () => {
    expect(number().gt(2).validate(1)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 1,
        param: 2,
      },
    ]);
    expect(number().gt(2).validate(2)).toEqual([
      {
        code: 'numberGreaterThan',
        path: [],
        input: 2,
        param: 2,
      },
    ]);
  });

  test('raises if value is not greater than or equal', () => {
    expect(number().gte(2).validate(1)).toEqual([
      {
        code: 'numberGreaterThanOrEqual',
        path: [],
        input: 1,
        param: 2,
      },
    ]);
    expect(number().gte(2).validate(2)).toEqual([]);
  });

  test('raises if value is not less than', () => {
    expect(number().lt(2).validate(3)).toEqual([
      {
        code: 'numberLessThan',
        path: [],
        input: 3,
        param: 2,
      },
    ]);
    expect(number().lt(2).validate(2)).toEqual([
      {
        code: 'numberLessThan',
        path: [],
        input: 2,
        param: 2,
      },
    ]);
  });

  test('raises if value is not less than or equal', () => {
    expect(number().lte(2).validate(3)).toEqual([
      {
        code: 'numberLessThanOrEqual',
        path: [],
        input: 3,
        param: 2,
      },
    ]);
    expect(number().lte(2).validate(2)).toEqual([]);
  });

  test('raises if value is not a multiple of', () => {
    expect(number().multipleOf(2).validate(3)).toEqual([
      {
        code: 'numberMultipleOf',
        path: [],
        input: 3,
        param: 2,
      },
    ]);
    expect(number().multipleOf(2).validate(4)).toEqual([]);
  });
});
