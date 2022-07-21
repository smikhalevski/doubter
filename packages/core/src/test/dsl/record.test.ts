import { number, record, string } from '../../main';

describe('record', () => {
  test('allows a record', () => {
    expect(record(string(), number()).validate({ aaa: 111 })).toEqual([]);
  });

  test('raises if record value has an illegal type', () => {
    expect(record(number()).validate({ aaa: 'bbb' })).toEqual([
      {
        code: 'type',
        path: ['aaa'],
        input: 'bbb',
        param: 'number',
      },
    ]);
  });

  test('raises if record key has an illegal type', () => {
    expect(record(string().max(2), number()).validate({ aaa: 111 })).toEqual([
      {
        code: 'stringMaxLength',
        path: [],
        input: 'aaa',
        param: 2,
      },
    ]);
  });

  test('applies constrains to properties asynchronously', async () => {
    const type = record(
      string()
        .max(2)
        .transformAsync(input => Promise.resolve(input)),
      number().transformAsync(input => Promise.resolve(input))
    );

    expect(await type.validateAsync({ aaa: 'bbb' })).toEqual([
      {
        code: 'stringMaxLength',
        input: 'aaa',
        param: 2,
        path: [],
      },
      {
        code: 'type',
        input: 'bbb',
        param: 'number',
        path: ['aaa'],
      },
    ]);
  });
});
