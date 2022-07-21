import { lazy, string } from '../../main';

describe('lazy', () => {
  test('uses the type returned from provider to parse the input', () => {
    const type = string();

    const parseMethodSpy = jest.spyOn(type, '_parse');

    expect(lazy(() => type).validate(111)).toEqual([
      {
        code: 'type',
        path: [],
        input: 111,
        param: 'string',
      },
    ]);

    expect(parseMethodSpy).toHaveBeenCalledTimes(1);
  });

  test('inherits async status', () => {
    expect(lazy(() => string().transformAsync(() => Promise.resolve(222))).isAsync()).toBe(true);
  });
});
