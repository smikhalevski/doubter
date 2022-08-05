import { NumberType, StringType, TupleType } from '../../main';

describe('tuple', () => {
  test('allows a tuple', () => {
    expect(new TupleType([new StringType()]).validate(['aaa'])).toBe(null);
  });

  test('raises if value is not an array', () => {
    expect(new TupleType([new StringType()]).validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'array',
        message: 'Must be an array',
        meta: undefined,
      },
    ]);
  });

  test('raises if tuple element is of an invalid type', () => {
    expect(new TupleType([new StringType(), new NumberType()]).validate(['aaa', 'bbb'])).toEqual([
      {
        code: 'type',
        path: [1],
        input: 'bbb',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises if tuple has an invalid length', () => {
    expect(new TupleType([new StringType(), new NumberType()]).validate([111])).toEqual([
      {
        code: 'tupleLength',
        path: [],
        input: [111],
        param: 2,
        message: 'Must have a length of 2',
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to elements asynchronously', async () => {
    const type = new TupleType([new StringType(), new NumberType().transformAsync(value => Promise.resolve(value))]);

    expect(await type.validateAsync(['aaa', 'bbb'])).toEqual([
      {
        code: 'type',
        path: [1],
        input: 'bbb',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('returns child type at key', () => {
    const childType1 = new StringType();
    const childType2 = new NumberType();
    const type = new TupleType([childType1, childType2]);

    expect(type.at(0)).toBe(childType1);
    expect(type.at(1)).toBe(childType2);
    expect(type.at(2)).toBe(null);
    expect(type.at(-1)).toBe(null);
    expect(type.at('aaa')).toBe(null);
  });
});
