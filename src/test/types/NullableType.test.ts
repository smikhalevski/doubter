import { ArrayType, NullableType, NumberType, OptionalType, StringType } from '../../main';

describe('NullableType', () => {
  test('allows null', () => {
    expect(new NullableType(new StringType()).validate(null)).toBe(null);
  });

  test('passes non-null values to the underlying type', () => {
    expect(new NullableType(new StringType()).validate(111)).toEqual([
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

  test('returns a Promise that resolves with null', async () => {
    const type = new NullableType(new StringType().transformAsync(() => Promise.resolve(222)));
    const output = type.parse(null);

    expect(output).toBeInstanceOf(Promise);
    expect(await output).toBe(null);
  });

  test('inherits async status', () => {
    const type = new NullableType(new StringType().transformAsync(() => Promise.resolve(222)));

    expect(type.async).toBe(true);
  });

  test('returns child type at key', () => {
    const childType = new NumberType();
    const type = new NullableType(new ArrayType(childType));

    expect(type.at(1)).toStrictEqual(new OptionalType(childType));
    expect(type.at(-1)).toBe(null);
    expect(type.at(0.5)).toBe(null);
    expect(type.at('aaa')).toBe(null);
  });
});
