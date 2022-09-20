import { NumberShape, RecordShape, StringShape } from '../../../main';

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
        code: 'type',
        path: ['aaa'],
        input: 'bbb',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises if record key has an illegal type', () => {
    expect(new RecordShape(stringShape.max(2), numberShape).validate({ aaa: 111 })).toEqual([
      {
        code: 'stringMax',
        path: ['aaa'],
        input: 'aaa',
        param: 2,
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to properties asynchronously', async () => {
    const type = new RecordShape(
      stringShape.max(2).transformAsync(value => Promise.resolve(value)),
      asyncNumberShape
    );

    expect(await type.validateAsync({ aaa: 'bbb' })).toEqual([
      {
        code: 'stringMax',
        input: 'aaa',
        param: 2,
        path: ['aaa'],
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
      {
        code: 'type',
        input: 'bbb',
        param: 'number',
        path: ['aaa'],
        message: 'Must be a number',
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
