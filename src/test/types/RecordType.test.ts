import { NumberType, RecordType, StringType } from '../../main';

describe('RecordType', () => {
  test('allows a record', () => {
    expect(new RecordType(new StringType(), new NumberType()).validate({ aaa: 111 })).toBe(null);
  });

  test('raises if record value has an illegal type', () => {
    expect(new RecordType(new StringType(), new NumberType()).validate({ aaa: 'bbb' })).toEqual([
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
    expect(new RecordType(new StringType().max(2), new NumberType()).validate({ aaa: 111 })).toEqual([
      {
        code: 'stringMaxLength',
        path: ['aaa'],
        input: 'aaa',
        param: 2,
        message: 'Must have the maximum length of 2',
        meta: undefined,
      },
    ]);
  });

  test('applies constrains to properties asynchronously', async () => {
    const type = new RecordType(
      new StringType().max(2).transformAsync(input => Promise.resolve(input)),
      new NumberType().transformAsync(input => Promise.resolve(input))
    );

    expect(await type.validateAsync({ aaa: 'bbb' })).toEqual([
      {
        code: 'stringMaxLength',
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
    const childType = new NumberType();
    const type = new RecordType(new StringType(), childType);

    expect(type.at('aaa')).toBe(childType);
    expect(type.at(1)).toBe(null);
  });
});
