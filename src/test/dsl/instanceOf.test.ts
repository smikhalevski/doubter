import * as d from '../../main';

describe('instanceOf', () => {
  class Foo {}

  test('infers type', () => {
    const value: Foo = d.instanceOf(Foo).parse(new Foo());
  });

  test('returns an instance shape', () => {
    expect(d.instanceOf(Foo)).toBeInstanceOf(d.InstanceShape);
  });
});
