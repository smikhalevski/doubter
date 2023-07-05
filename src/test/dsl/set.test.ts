import * as d from '../../main';

describe('set', () => {
  test('returns a Set shape', () => {
    const valueShape = d.number();
    const shape = d.set(valueShape);

    expect(shape.valueShape).toBe(valueShape);
  });
});
