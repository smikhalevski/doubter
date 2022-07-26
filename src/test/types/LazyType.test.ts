import { LazyType, StringType } from '../../main';

describe('LazyType', () => {
  test('uses the type returned from provider to parse the input', () => {
    const type = new StringType();

    const parserSpy = jest.spyOn(type, 'parse');

    expect(new LazyType(() => type).validate(111)).toEqual([
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

    const type = new LazyType(providerMock);

    type.validate(111);
    type.validate(222);

    expect(providerMock).toHaveBeenCalledTimes(1);
  });

  test('inherits async status', () => {
    const type = new LazyType(() => new StringType().transformAsync(() => Promise.resolve(222)));

    expect(type.isAsync()).toBe(true);
  });
});
