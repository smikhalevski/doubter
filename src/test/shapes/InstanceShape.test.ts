import { InstanceShape } from '../../main';
import { CODE_INSTANCE } from '../../main/v3/shapes/constants';

describe('InstanceShape', () => {
  class Foo {}

  test('allows an instance of class', () => {
    expect(new InstanceShape(Foo).validate(new Foo())).toBe(null);
  });

  test('raises if value is not an instance of the class', () => {
    expect(new InstanceShape(Foo).validate({})).toEqual([
      {
        code: CODE_INSTANCE,
        path: [],
        input: {},
        param: Foo,
        message: 'Must be a class instance',
        meta: undefined,
      },
    ]);
  });

  test('overrides message for type issue', () => {
    expect(new InstanceShape(Foo, { message: 'xxx', meta: 'yyy' }).validate({})).toEqual([
      {
        code: CODE_INSTANCE,
        path: [],
        input: {},
        param: Foo,
        message: 'xxx',
        meta: 'yyy',
      },
    ]);
  });
});
