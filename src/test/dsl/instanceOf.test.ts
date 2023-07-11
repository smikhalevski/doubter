import * as d from '../../main';

describe('instanceOf', () => {
  test('returns an instance shape', () => {
    class TestClass {}

    expect(d.instanceOf(TestClass)).toBeInstanceOf(d.InstanceShape);
  });
});
