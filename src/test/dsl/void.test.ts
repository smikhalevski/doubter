import * as d from '../../main';

describe('void', () => {
  test('returns a const shape', () => {
    const shape = d.void();

    expect(shape).toBeInstanceOf(d.ConstShape);
    expect(shape.value).toBe(undefined);
  });
});
