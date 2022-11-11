import { InstanceShape } from '../../main';
import { CODE_INSTANCE } from '../../main/constants';

describe('InstanceShape', () => {
  class Foo {}

  test('allows an instance of class', () => {
    const value = new Foo();

    expect(new InstanceShape(Foo).parse(value)).toBe(value);
  });

  test('raises if value is not an instance of the class', () => {
    expect(new InstanceShape(Foo).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, path: [], input: {}, param: Foo, message: 'Must be a class instance' }],
    });
  });

  test('overrides message for type issue', () => {
    expect(new InstanceShape(Foo, { message: 'aaa', meta: 'bbb' }).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, path: [], input: {}, param: Foo, message: 'aaa', meta: 'bbb' }],
    });
  });
});
