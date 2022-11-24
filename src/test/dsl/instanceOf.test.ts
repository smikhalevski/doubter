import * as d from '../../main';

describe('instanceOf', () => {
  test('returns an instance shape', () => {
    class Foo {}

    expect(d.instanceOf(Foo)).toBeInstanceOf(d.InstanceShape);
  });
});
