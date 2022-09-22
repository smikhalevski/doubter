import { ArrayShape, LazyShape, NumberShape, StringShape } from '../../main';
import { CODE_TYPE, TYPE_STRING } from '../../main/shapes/constants';

describe('LazyShape', () => {
  test('uses the shape returned from provider to parse the input', () => {
    const shape = new StringShape();

    const parserSpy = jest.spyOn(shape, 'parse');

    expect(new LazyShape(false, () => shape).validate(111)).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
    ]);

    expect(parserSpy).toHaveBeenCalledTimes(1);
  });

  test('provider is called only once', () => {
    const providerMock = jest.fn(() => new StringShape());

    const type = new LazyShape(false, providerMock);

    type.validate(111);
    type.validate(222);

    expect(providerMock).toHaveBeenCalledTimes(1);
  });

  test('returns child type at key', () => {
    const childShape = new NumberShape();
    const type = new LazyShape(false, () => new ArrayShape(childShape));

    expect(type.at(1)).toBe(childShape);
    expect(type.at(-1)).toBe(null);
    expect(type.at(0.5)).toBe(null);
    expect(type.at('aaa')).toBe(null);
  });
});
