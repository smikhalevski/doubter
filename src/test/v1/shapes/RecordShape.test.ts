import { NumberShape, RecordShape, StringShape } from '../../../main';
import {
  CODE_STRING_MAX,
  CODE_TYPE,
  MESSAGE_NUMBER_TYPE,
  MESSAGE_STRING_MAX,
  TYPE_NUMBER,
} from '../../../main/v1/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

const asyncStringShape = stringShape.transformAsync(value => Promise.resolve(value));
const asyncNumberShape = numberShape.transformAsync(value => Promise.resolve(value));

describe('RecordShape', () => {
  test('allows a record', () => {
    expect(new RecordShape(stringShape, numberShape).validate({ aaa: 111 })).toBe(null);
  });

  test('raises if record value has an illegal type', () => {
    expect(new RecordShape(stringShape, numberShape).validate({ aaa: 'bbb' })).toEqual([
      {
        code: CODE_TYPE,
        path: ['aaa'],
        input: 'bbb',
        param: TYPE_NUMBER,
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if record value has an illegal type in an async mode', async () => {
    expect(await new RecordShape(asyncStringShape, asyncNumberShape).validateAsync({ aaa: 'bbb' })).toEqual([
      {
        code: CODE_TYPE,
        path: ['aaa'],
        input: 'bbb',
        param: TYPE_NUMBER,
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('raises if record key has an illegal type', () => {
    expect(new RecordShape(stringShape.max(2), numberShape).validate({ aaa: 111 })).toEqual([
      {
        code: CODE_STRING_MAX,
        path: ['aaa'],
        input: 'aaa',
        param: 2,
        message: MESSAGE_STRING_MAX + 2,
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to properties', () => {
    const shape = new RecordShape(stringShape.max(2), numberShape);

    expect(shape.validate({ aaa: 'bbb' })).toEqual([
      {
        code: CODE_STRING_MAX,
        input: 'aaa',
        param: 2,
        path: ['aaa'],
        message: MESSAGE_STRING_MAX + 2,
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        input: 'bbb',
        param: TYPE_NUMBER,
        path: ['aaa'],
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to properties in async mode', async () => {
    const shape = new RecordShape(
      stringShape.max(2).transformAsync(value => Promise.resolve(value)),
      asyncNumberShape
    );

    expect(await shape.validateAsync({ aaa: 'bbb' })).toEqual([
      {
        code: CODE_STRING_MAX,
        input: 'aaa',
        param: 2,
        path: ['aaa'],
        message: MESSAGE_STRING_MAX + 2,
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        input: 'bbb',
        param: TYPE_NUMBER,
        path: ['aaa'],
        message: MESSAGE_NUMBER_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('returns child type at key', () => {
    const shape = new RecordShape(stringShape, numberShape);

    expect(shape.at('aaa')).toBe(numberShape);
    expect(shape.at(1)).toBe(null);
  });
});
