import * as d from '../../main';

describe('instanceOf', () => {
  class Foo {}

  test('infers type', () => {
    const output: Foo = d.instanceOf(Foo).parse(new Foo());
  });

  test('returns an instanceOf shape', () => {
    expect(d.instanceOf(Foo)).toBeInstanceOf(d.InstanceShape);
  });
});
