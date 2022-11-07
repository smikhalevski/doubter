import { NumberShape, RecordShape, StringShape } from '../../main';
import { CODE_STRING_MAX, CODE_TYPE, TYPE_NUMBER } from '../../main/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

const asyncNumberShape = numberShape.convertAsync(value => Promise.resolve(value));

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
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to properties', () => {
    const shape = new RecordShape(stringShape.max(2), numberShape);

    expect(shape.validate({ aaa: 'bbb' }, { verbose: true })).toEqual([
      {
        code: CODE_STRING_MAX,
        input: 'aaa',
        param: 2,
        path: ['aaa'],
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        input: 'bbb',
        param: TYPE_NUMBER,
        path: ['aaa'],
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to properties in async mode', async () => {
    const shape = new RecordShape(
      stringShape.max(2).convertAsync(value => Promise.resolve(value)),
      asyncNumberShape
    );

    expect(await shape.validateAsync({ aaa: 'bbb' }, { verbose: true })).toEqual([
      {
        code: CODE_STRING_MAX,
        input: 'aaa',
        param: 2,
        path: ['aaa'],
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        input: 'bbb',
        param: TYPE_NUMBER,
        path: ['aaa'],
        message: expect.any(String),
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
