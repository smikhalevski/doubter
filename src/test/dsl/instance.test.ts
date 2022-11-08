import { instanceOf, InstanceShape } from '../../main';

describe('instanceOf', () => {
  class Foo {}

  test('infers type', () => {
    const output: Foo = instanceOf(Foo).parse(new Foo());
  });

  test('returns an instanceOf shape', () => {
    expect(instanceOf(Foo)).toBeInstanceOf(InstanceShape);
  });
});
