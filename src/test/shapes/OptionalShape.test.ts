import { ArrayShape, NumberShape, OptionalShape, StringShape } from '../../main';
import { CODE_TYPE, TYPE_STRING } from '../../main/v3/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

describe('OptionalShape', () => {
  test('allows undefined', () => {
    expect(new OptionalShape(stringShape).validate(undefined)).toBe(null);
  });

  test('infers non-undefined output', () => {
    const output: string = new OptionalShape(stringShape, 'aaa').parse(undefined);
  });

  test('returns the default value', () => {
    expect(new OptionalShape(stringShape, 'aaa').parse(undefined)).toBe('aaa');
  });

  test('passes non-null values to the underlying type', () => {
    expect(new OptionalShape(stringShape).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('returns a Promise that resolves with undefined', async () => {
    const shape = new OptionalShape(stringShape.transformAsync(() => Promise.resolve(222)));

    expect(await shape.parseAsync(undefined)).toBe(undefined);
  });

  test('returns a Promise that resolves with the default value', async () => {
    const shape = new OptionalShape(
      stringShape.transformAsync(() => Promise.resolve(222)),
      333
    );

    expect(await shape.parseAsync(undefined)).toBe(333);
  });

  test('returns child type at key', () => {
    const shape = new OptionalShape(new ArrayShape(numberShape));

    expect(shape.at(1)).toStrictEqual(new OptionalShape(numberShape));
    expect(shape.at(-1)).toBe(null);
    expect(shape.at(0.5)).toBe(null);
    expect(shape.at('aaa')).toBe(null);
  });
});
