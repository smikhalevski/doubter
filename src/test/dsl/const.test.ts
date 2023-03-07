import * as d from '../../main';

describe('const', () => {
  test('returns a const shape', () => {
    const shape = d.const(111);

    expect(shape).toBeInstanceOf(d.ConstShape);
  });
});
