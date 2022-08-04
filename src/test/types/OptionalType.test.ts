import { ArrayType, NumberType, OptionalType, StringType } from '../../main';

describe('OptionalType', () => {
  test('allows undefined', () => {
    expect(new OptionalType(new StringType()).validate(undefined)).toBe(null);
  });

  test('returns the default value', () => {
    expect(new OptionalType(new StringType(), 'aaa').parse(undefined)).toBe('aaa');
  });

  test('passes non-null values to the underlying type', () => {
    expect(new OptionalType(new StringType()).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
    ]);
  });

  test('returns a Promise that resolves with undefined', async () => {
    const type = new OptionalType(new StringType().transformAsync(() => Promise.resolve(222)));
    const output = type.parse(undefined);

    expect(output).toBeInstanceOf(Promise);
    expect(await output).toBe(undefined);
  });

  test('returns a Promise that resolves with the default value', async () => {
    const type = new OptionalType(
      new StringType().transformAsync(() => Promise.resolve(222)),
      333
    );
    const output = type.parse(undefined);

    expect(output).toBeInstanceOf(Promise);
    expect(await output).toBe(333);
  });

  test('inherits async status', () => {
    const type = new OptionalType(new StringType().transformAsync(() => Promise.resolve(222)));

    expect(type.async).toBe(true);
  });

  test('returns child type at key', () => {
    const childType = new NumberType();
    const type = new OptionalType(new ArrayType(childType));

    expect(type.at(1)).toStrictEqual(new OptionalType(childType));
    expect(type.at(-1)).toBe(null);
    expect(type.at(0.5)).toBe(null);
    expect(type.at('aaa')).toBe(null);
  });
});
