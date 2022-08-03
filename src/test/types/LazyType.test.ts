import { LazyType, StringType } from '../../main';

describe('LazyType', () => {
  test('uses the type returned from provider to parse the input', () => {
    const type = new StringType();

    const parserSpy = jest.spyOn(type, 'parse');

    expect(new LazyType(false, () => type).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
    ]);

    expect(parserSpy).toHaveBeenCalledTimes(1);
  });

  test('provider is called only once', () => {
    const providerMock = jest.fn(() => new StringType());

    const type = new LazyType(false, providerMock);

    type.validate(111);
    type.validate(222);

    expect(providerMock).toHaveBeenCalledTimes(1);
  });
});