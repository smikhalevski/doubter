import { InstanceOfType } from '../../main';

describe('InstanceOfType', () => {
  class Foo {}

  test('allows an instance of class', () => {
    expect(new InstanceOfType(Foo).validate(new Foo())).toBe(null);
  });

  test('raises if value is not an instance of the class', () => {
    expect(new InstanceOfType(Foo).validate({})).toEqual([
      {
        code: 'instanceOf',
        path: [],
        input: {},
        param: Foo,
        message: 'Must be an instance of Foo',
        meta: undefined,
      },
    ]);
  });

  test('overrides message for type issue', () => {
    expect(new InstanceOfType(Foo, { message: 'xxx', meta: 'yyy' }).validate({})).toEqual([
      {
        code: 'instanceOf',
        path: [],
        input: {},
        param: Foo,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });
});
