import * as d from '../../main';

describe('promise', () => {
  test('returns a Promise shape', () => {
    expect(d.promise(d.string())).toBeInstanceOf(d.PromiseShape);
  });
});
