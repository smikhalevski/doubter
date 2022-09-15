import { NumberShape, RecordShape, StringShape } from '../../../main';

describe('RecordShape', () => {
  test('allows a record', () => {
    expect(new RecordShape(new StringShape(), new NumberShape()).validate({ aaa: 111 })).toBe(null);
  });

  test('raises if record value has an illegal type', () => {
    expect(new RecordShape(new StringShape(), new NumberShape()).validate({ aaa: 'bbb' })).toEqual([
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
    expect(new RecordShape(new StringShape().max(2), new NumberShape()).validate({ aaa: 111 })).toEqual([
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
      new StringShape().max(2).transformAsync(input => Promise.resolve(input)),
      new NumberShape().transformAsync(input => Promise.resolve(input))
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
    const valueShape = new NumberShape();
    const type = new RecordShape(new StringShape(), valueShape);

    expect(type.at('aaa')).toBe(valueShape);
    expect(type.at(1)).toBe(null);
  });
});
