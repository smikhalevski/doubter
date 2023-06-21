import * as d from '../../main';

describe('promise', () => {
  test('returns an unconstrained Promise shape', () => {
    const promiseShape = d.promise();

    expect(promiseShape).toBeInstanceOf(d.PromiseShape);
    expect(promiseShape.shape).toBeNull();
  });

  test('returns a Promise shape with constrained returned value', () => {
    const shape = d.string();
    const promiseShape = d.promise(shape);

    expect(promiseShape).toBeInstanceOf(d.PromiseShape);
    expect(promiseShape.shape).toBe(shape);
  });
});
