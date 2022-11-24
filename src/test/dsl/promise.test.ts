import * as d from '../../main';

describe('promise', () => {
  test('returns a promise shape', () => {
    expect(d.promise(d.string())).toBeInstanceOf(d.PromiseShape);
  });
});
