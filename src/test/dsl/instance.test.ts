import * as d from '../../main';

describe('instance', () => {
  test('returns an instance shape', () => {
    class TestClass {}

    expect(d.instance(TestClass)).toBeInstanceOf(d.InstanceShape);
  });
});
