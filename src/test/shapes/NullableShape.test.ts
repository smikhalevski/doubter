import { ArrayShape, NullableShape, NumberShape, OptionalShape, StringShape } from '../../main';
import { CODE_TYPE, MESSAGE_STRING_TYPE, TYPE_STRING } from '../../main/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

describe('NullableShape', () => {
  test('allows null', () => {
    expect(new NullableShape(stringShape).validate(null)).toBe(null);
  });

  test('passes non-null values to the underlying type', () => {
    expect(new NullableShape(stringShape).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_STRING,
        message: MESSAGE_STRING_TYPE,
        meta: undefined,
      },
    ]);
  });

  test('invokes constraints', () => {
    const constrainMock = jest.fn(() => undefined);

    new NullableShape(stringShape).constrain(constrainMock).validate('aaa');

    expect(constrainMock).toHaveBeenCalledTimes(1);
  });

  test('invokes constraints in an async mode', async () => {
    const constrainMock = jest.fn(() => undefined);

    await new NullableShape(stringShape).constrain(constrainMock).validateAsync('aaa');

    expect(constrainMock).toHaveBeenCalledTimes(1);
  });

  test('invokes unsafe constraints', () => {
    const constrainMock = jest.fn(() => undefined);

    new NullableShape(stringShape).constrain(constrainMock, { unsafe: true }).validate(111);

    expect(constrainMock).toHaveBeenCalledTimes(1);
  });

  test('invokes unsafe constraints in an async mode', async () => {
    const constrainMock = jest.fn(() => undefined);

    await new NullableShape(stringShape).constrain(constrainMock, { unsafe: true }).validateAsync(111);

    expect(constrainMock).toHaveBeenCalledTimes(1);
  });

  test('returns a promise that resolves with a null', async () => {
    const shape = new NullableShape(stringShape.transformAsync(() => Promise.resolve(222)));

    expect(await shape.parseAsync(null)).toBe(null);
  });

  test('returns child type at key', () => {
    const shape = new NullableShape(new ArrayShape(numberShape));

    expect(shape.at(1)).toStrictEqual(new OptionalShape(numberShape));
    expect(shape.at(-1)).toBe(null);
    expect(shape.at(0.5)).toBe(null);
    expect(shape.at('aaa')).toBe(null);
  });
});
