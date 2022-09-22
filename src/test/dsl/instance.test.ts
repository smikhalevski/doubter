import { instance, InstanceShape } from '../../main';

describe('instanceOf', () => {
  class Foo {}

  test('infers type', () => {
    const output: Foo = instance(Foo).parse(new Foo());
  });

  test('returns an instanceOf shape', () => {
    expect(instance(Foo)).toBeInstanceOf(InstanceShape);
  });
});
