import { instanceOf, InstanceOfType } from '../../main';

describe('instanceOf', () => {
  test('returns an instanceOf type', () => {
    expect(instanceOf(class Foo {})).toBeInstanceOf(InstanceOfType);
  });
});
