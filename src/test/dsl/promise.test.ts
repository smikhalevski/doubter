import * as d from '../../main';

describe('promise', () => {
  test('infers type', () => {
    const value: Promise<Promise<string>> = d.promise(d.string()).parseAsync(Promise.resolve('aaa'));
  });

  test('returns a promise shape', () => {
    expect(d.promise(d.string())).toBeInstanceOf(d.PromiseShape);
  });
});
