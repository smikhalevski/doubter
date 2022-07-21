import { number, string, tuple } from '../../main';

describe('tuple', () => {
  test('allows a tuple', () => {
    expect(tuple(string()).validate(['aaa'])).toEqual([]);
  });

  test('raises if value is not a tuple', () => {
    expect(tuple(string()).validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'array',
      },
    ]);
  });

  test('raises if tuple element is of invalid type', () => {
    expect(tuple(string(), number()).validate(['aaa', 'bbb'])).toEqual([
      {
        code: 'type',
        path: [1],
        input: 'bbb',
        param: 'number',
      },
    ]);
  });

  test('raises if tuple has invalid length', () => {
    expect(tuple(string(), number()).validate(['aaa'])).toEqual([
      {
        code: 'tupleLength',
        path: [],
        input: ['aaa'],
        param: 2,
      },
      {
        code: 'type',
        path: [1],
        input: undefined,
        param: 'number',
      },
    ]);
  });

  test('applies constrains to elements asynchronously', async () => {
    const type = tuple(
      string(),
      number().transformAsync(input => Promise.resolve(input))
    );

    expect(await type.validateAsync(['aaa', 'bbb'])).toEqual([
      {
        code: 'type',
        path: [1],
        input: 'bbb',
        param: 'number',
      },
    ]);
  });
});
