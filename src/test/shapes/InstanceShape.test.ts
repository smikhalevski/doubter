import { InstanceShape } from '../../main';
import { CODE_INSTANCE } from '../../main/constants';

describe('InstanceShape', () => {
  class Foo {}

  test('creates an instance shape', () => {
    const shape = new InstanceShape(Foo);

    expect(shape.ctor).toBe(Foo);
    expect(shape.inputTypes).toEqual(['object']);
  });

  test('uses array input type for an Array and its subclasses', () => {
    expect(new InstanceShape(Array).inputTypes).toEqual(['array']);
    expect(new InstanceShape(class extends Array {}).inputTypes).toEqual(['array']);
  });

  test('uses date input type for an Date and its subclasses', () => {
    expect(new InstanceShape(Date).inputTypes).toEqual(['date']);
    expect(new InstanceShape(class extends Date {}).inputTypes).toEqual(['date']);
  });

  test('parses an instance of a class', () => {
    const value = new Foo();

    expect(new InstanceShape(Foo).parse(value)).toBe(value);
  });

  test('raises an issue if an input is not an instance of the class', () => {
    expect(new InstanceShape(Foo).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, input: {}, param: Foo, message: 'Must be a class instance' }],
    });
  });

  test('overrides a message for a type issue', () => {
    expect(new InstanceShape(Foo, { message: 'aaa', meta: 'bbb' }).try({})).toEqual({
      ok: false,
      issues: [{ code: CODE_INSTANCE, input: {}, param: Foo, message: 'aaa', meta: 'bbb' }],
    });
  });
});
