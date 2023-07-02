import * as d from '../../main';

describe('instance', () => {
  test('returns an instance shape', () => {
    class Foo {}

    expect(d.instance(Foo)).toBeInstanceOf(d.InstanceShape);
  });
});
