import { array, number, string } from '../../main';

describe('array', () => {
  test('raises if value is not an array', () => {
    expect(array().validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'array',
      },
    ]);
  });

  test('raises if an array does not conform the minimum length', () => {
    expect(array().min(2).validate([1])).toEqual([
      {
        code: 'arrayMinLength',
        path: [],
        input: [1],
        param: 2,
      },
    ]);
  });

  test('allows an array that conforms the minimum length', () => {
    expect(array().min(2).validate([1, 2])).toEqual([]);
  });

  test('raises if an array does not conform the maximum length', () => {
    expect(array().max(2).validate([1, 2, 3])).toEqual([
      {
        code: 'arrayMaxLength',
        path: [],
        input: [1, 2, 3],
        param: 2,
      },
    ]);
  });

  test('applies constrains to elements synchronously', () => {
    expect(array(string()).validate(['aaa', 111])).toEqual([
      {
        code: 'type',
        path: [1],
        input: 111,
        param: 'string',
      },
    ]);
  });

  test('inherits async status', () => {
    expect(array(string().transformAsync(() => Promise.resolve(222))).isAsync()).toBe(true);
  });

  test('applies constrains to elements asynchronously', async () => {
    const type = array(string().transformAsync(() => Promise.resolve(222)));

    expect(await type.validateAsync(['aaa', 111])).toEqual([
      {
        code: 'type',
        path: [1],
        input: 111,
        param: 'string',
      },
    ]);
  });

  test('allows an array that conforms the maximum length', () => {
    expect(array().max(3).validate([1, 2])).toEqual([]);
  });

  test('returns an array copy', () => {
    const input = [1, 2];
    const output = array(number()).parse(input);

    expect(input).not.toBe(output);
    expect(input).toEqual(output);
  });

  test('returns an array copy if elements are unconstrained', () => {
    const input = [1, 2];
    const output = array().parse(input);

    expect(input).not.toBe(output);
    expect(input).toEqual(output);
  });
});
