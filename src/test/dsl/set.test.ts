import * as d from '../../main';

describe('set', () => {
  test('returns a Set shape', () => {
    const shape = d.number();
    const setShape = d.set(shape);

    expect(setShape.shape).toBe(shape);
  });
});
