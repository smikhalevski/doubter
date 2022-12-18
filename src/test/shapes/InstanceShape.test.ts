import { InstanceShape } from '../../main';
import { CODE_INSTANCE } from '../../main/constants';

describe('InstanceShape', () => {
  class Foo {}

  test('creates an instance shape', () => {
    const shape = new InstanceShape(Foo);

    expect(shape.ctor).toBe(Foo);
    expect(shape['_inputTypes']).toEqual(['object']);
  });

  test('uses array input type for an Array and its subclasses', () => {
    expect(new InstanceShape(Array)['_inputTypes']).toEqual(['array']);
    expect(new InstanceShape(class extends Array {})['_inputTypes']).toEqual(['array']);
  });

  test('parses an instance of a class', () => {
    const value = new Foo();

    expect(new InstanceShape(Foo).parse(value)).toBe(value);
  });

  test('raises an issue if an input is not an instance of the class', () => {
    expect(new InstanceShape(Foo).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, path: [], input: {}, param: Foo, message: 'Must be a class instance' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new InstanceShape(Foo, { message: 'aaa', meta: 'bbb' }).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, path: [], input: {}, param: Foo, message: 'aaa', meta: 'bbb' }],
    });
  });
});
