import { NumberType, ObjectType, StringType } from '../../main';

describe('ObjectType', () => {
  test('allows an empty object', () => {
    expect(new ObjectType({}, null).validate({})).toBe(null);
  });

  test('raises if not an object', () => {
    expect(new ObjectType({}, null).validate('aaa')).toEqual([
      {
        code: 'type',
        path: [],
        input: 'aaa',
        param: 'object',
        message: 'Must be an object',
        meta: undefined,
      },
    ]);
  });

  test('raises when an object is exact and an unknown key is present', () => {
    const type = new ObjectType({ foo: new StringType() }, null).exact();

    expect(type.validate({ foo: 'aaa', bar: 'aaa' })).toEqual([
      {
        code: 'unknownKeys',
        path: [],
        input: {
          bar: 'aaa',
          foo: 'aaa',
        },
        param: 'bar',
        message: 'Must have known keys but found bar',
        meta: undefined,
      },
    ]);
  });

  test('strips unknown keys', () => {
    const type = new ObjectType({ foo: new StringType() }, null).strip();

    expect(type.parse({ foo: 'aaa', bar: 'aaa' })).toEqual({ foo: 'aaa' });
  });

  test('preserves unknown properties', () => {
    const type = new ObjectType({ foo: new StringType() }, null).strip().preserve();

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('preserves unknown properties by default', () => {
    const type = new ObjectType({ foo: new StringType() }, null);

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('extends object type with new properties', () => {
    const type = new ObjectType({ foo: new StringType() }, null).extend({ bar: new NumberType() }).strip();

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('merges object type with another object', () => {
    const type = new ObjectType({ foo: new StringType() }, null)
      .extend(new ObjectType({ bar: new NumberType() }, null))
      .strip();

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('picks properties from an abject', () => {
    const type = new ObjectType({ foo: new StringType(), bar: new NumberType() }, null).pick('foo').strip();

    expect(type.parse({ foo: 'aaa', bar: 'bbb' })).toEqual({ foo: 'aaa' });
  });

  test('omits properties in an abject', () => {
    const type = new ObjectType({ foo: new StringType(), bar: new NumberType() }, null).omit('foo').strip();

    expect(type.parse({ foo: 'aaa', bar: 111 })).toEqual({ bar: 111 });
  });

  test('raises issue when a property is absent', () => {
    expect(new ObjectType({ foo: new StringType(), bar: new NumberType() }, null).validate({ foo: 'aaa' })).toEqual([
      {
        code: 'type',
        path: ['bar'],
        input: undefined,
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises issue when a property is absent in async object', async () => {
    const type = new ObjectType(
      {
        foo: new StringType().transformAsync(value => Promise.resolve(value)),
        bar: new NumberType(),
      },
      null
    );
    expect(await type.validateAsync({ foo: 'aaa' })).toEqual([
      {
        code: 'type',
        path: ['bar'],
        input: undefined,
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises issue when an indexer property has invalid type', () => {
    const type = new ObjectType({ foo: new StringType() }, null).index(new StringType());

    expect(type.validate({ foo: 'aaa', bar: 111 })).toEqual([
      {
        code: 'type',
        path: ['bar'],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
    ]);
  });

  test('raises issue when an indexer property has invalid type in async object', async () => {
    const type = new ObjectType(
      { foo: new StringType().transformAsync(value => Promise.resolve(value)) },
      new StringType()
    );

    expect(await type.validateAsync({ foo: 'aaa', bar: 111 })).toEqual([
      {
        code: 'type',
        path: ['bar'],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues', () => {
    const type = new ObjectType({ foo: new StringType() }, new NumberType());

    expect(type.validate({ foo: 111, bar: 'aaa' })).toEqual([
      {
        code: 'type',
        path: ['foo'],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
      {
        code: 'type',
        path: ['bar'],
        input: 'aaa',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues in async object', async () => {
    const type = new ObjectType(
      { foo: new StringType().transformAsync(value => Promise.resolve(value)) },
      new NumberType().transformAsync(value => Promise.resolve(value))
    );

    expect(await type.validateAsync({ foo: 111, bar: 'aaa' })).toEqual([
      {
        code: 'type',
        path: ['foo'],
        input: 111,
        param: 'string',
        message: 'Must be a string',
        meta: undefined,
      },
      {
        code: 'type',
        path: ['bar'],
        input: 'aaa',
        param: 'number',
        message: 'Must be a number',
        meta: undefined,
      },
    ]);
  });

  test('returns the same object is unchanged', () => {
    const type = new ObjectType({ foo: new StringType() }, null);
    const input = { foo: 'aaa' };
    const output = type.parse(input);

    expect(input).toBe(output);
    expect(input).toEqual({ foo: 'aaa' });
  });

  test('returns the object clone if changed', () => {
    const type = new ObjectType({ foo: new NumberType().transform(() => 'aaa') }, null);
    const input = { foo: 111 };
    const output = type.parse(input);

    expect(input).not.toBe(output);
    expect(input).toEqual({ foo: 111 });
    expect(output).toEqual({ foo: 'aaa' });
  });
});
