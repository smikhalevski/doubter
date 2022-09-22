import { NumberShape, StringShape, TupleShape } from '../../main';
import {
  CODE_TUPLE_LENGTH,
  CODE_TYPE,
  MESSAGE_ARRAY_TYPE,
  MESSAGE_NUMBER_TYPE,
  TYPE_ARRAY,
  TYPE_NUMBER,
} from '../../main/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

describe('TupleShape', () => {
  test('infers type', () => {
    const output: [string, number] = new TupleShape([stringShape, numberShape]).parse(['aaa', 111]);
  });

  test('allows a tuple', () => {
    expect(new TupleShape([stringShape]).validate(['aaa'])).toBe(null);
  });

  test('raises if value is not an array', () => {
    expect(new TupleShape([stringShape]).validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_ARRAY,
        message: MESSAGE_ARRAY_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if tuple element is of an invalid type', () => {
    expect(new TupleShape([stringShape, numberShape]).validate(['aaa', 'bbb'])).toEqual([
      {
        code: CODE_TYPE,
        path: [1],
        input: 'bbb',
        param: TYPE_NUMBER,
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if tuple has an invalid length', () => {
    expect(new TupleShape([stringShape, numberShape]).validate([111])).toEqual([
      {
        code: CODE_TUPLE_LENGTH,
        path: [],
        input: [111],
        param: 2,
        message: 'Must have a length of 2',
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to elements asynchronously', async () => {
    const shape = new TupleShape([stringShape, numberShape.transformAsync(value => Promise.resolve(value))]);

    expect(await shape.validateAsync(['aaa', 'bbb'])).toEqual([
      {
        code: CODE_TYPE,
        path: [1],
        input: 'bbb',
        param: TYPE_NUMBER,
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('returns child type at key', () => {
    const shape = new TupleShape([stringShape, numberShape]);

    expect(shape.at(0)).toBe(stringShape);
    expect(shape.at(1)).toBe(numberShape);
    expect(shape.at(2)).toBe(null);
    expect(shape.at(-1)).toBe(null);
    expect(shape.at('aaa')).toBe(null);
  });
});
