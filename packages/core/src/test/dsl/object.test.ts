import { number, object, string } from '../../main';

describe('object', () => {
  test('allows an empty object', () => {
    expect(object({}).validate({})).toEqual([]);
  });

  test('strips unknown properties by default', () => {
    expect(object({ foo: string() }).parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa' });
  });

  test('extends object type with new properties', () => {
    const type = object({ foo: string() }).extend({ bar: number() });

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('merges object type with another object', () => {
    const type = object({ foo: string() }).extend(object({ bar: number() }));

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('picks properties from an abject', () => {
    const type = object({ foo: string(), bar: number() }).pick('foo');

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa' });
  });

  test('omits properties in an abject', () => {
    const type = object({ foo: string(), bar: number() }).omit('foo');

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ bar: 111 });
  });

  test('raises issue when a property is absent', () => {
    expect(object({ foo: string(), bar: number() }).validate({ foo: 'aaa' })).toEqual([
      {
        code: 'type',
        path: ['bar'],
        input: undefined,
        param: 'number',
      },
    ]);
  });

  test('raises issue when an indexed property has invalid type', () => {
    const type = object({ foo: string() }).index(string());

    expect(type.validate({ foo: 'aaa', bar: 111 })).toEqual([
      {
        code: 'type',
        path: ['bar'],
        input: 111,
        param: 'string',
      },
    ]);
  });
});
