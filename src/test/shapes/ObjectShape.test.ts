import { KeysMode, NumberShape, ObjectShape, StringShape } from '../../main';
import { CODE_TYPE, CODE_UNKNOWN_KEYS, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../../main/shapes/constants';

const stringShape = new StringShape();
const numberShape = new NumberShape();

const asyncStringShape = stringShape.transformAsync(value => Promise.resolve(value));
const asyncNumberShape = numberShape.transformAsync(value => Promise.resolve(value));

describe('ObjectShape', () => {
  test('allows an empty object', () => {
    const shape = new ObjectShape({}, null);

    expect(shape.keysMode).toBe(KeysMode.PRESERVED);
    expect(shape.validate({})).toBe(null);
  });

  test('raises if not an object', () => {
    expect(new ObjectShape({}, null).validate('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_OBJECT,
        message: 'Must be an object',
        meta: undefined,
      },
    ]);
  });

  test('raises if not an object in async mode', async () => {
    expect(await new ObjectShape({ foo: asyncStringShape }, null).validateAsync('aaa')).toEqual([
      {
        code: CODE_TYPE,
        path: [],
        input: 'aaa',
        param: TYPE_OBJECT,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises when an object must have exact keys and an unknown key is present', () => {
    const shape = new ObjectShape({ foo: stringShape }, null).exact();

    expect(shape.keysMode).toBe(KeysMode.EXACT);
    expect(shape.validate({ foo: 'aaa', bar: 'aaa' })).toEqual([
      {
        code: CODE_UNKNOWN_KEYS,
        path: [],
        input: {
          bar: 'aaa',
          foo: 'aaa',
        },
        param: ['bar'],
        message: 'Must not have unknown keys bar',
        meta: undefined,
      },
    ]);
  });

  test('raises when an object must have exact keys and an unknown key is present in async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape }, null).exact();

    expect(await shape.validateAsync({ foo: 'aaa', bar: 'aaa' })).toEqual([
      {
        code: CODE_UNKNOWN_KEYS,
        path: [],
        input: {
          bar: 'aaa',
          foo: 'aaa',
        },
        param: ['bar'],
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('strips unknown keys', () => {
    const shape = new ObjectShape({ foo: stringShape }, null).strip();

    expect(shape.keysMode).toBe(KeysMode.STRIPPED);
    expect(shape.parse({ foo: 'aaa', bar: 'aaa' })).toEqual({ foo: 'aaa' });
  });

  test('strips unknown keys in async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape }, null).strip();

    expect(await shape.parseAsync({ foo: 'aaa', bar: 'aaa' })).toEqual({ foo: 'aaa' });
  });

  test('preserves unknown properties', () => {
    const shape = new ObjectShape({ foo: stringShape }, null).strip().preserve();

    expect(shape.keysMode).toBe(KeysMode.PRESERVED);
    expect(shape.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('preserves unknown properties in async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape }, null).strip().preserve();

    expect(await shape.parseAsync({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('preserves unknown properties by default', () => {
    const shape = new ObjectShape({ foo: stringShape });

    expect(shape.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('preserves unknown properties by default in async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape });

    expect(await shape.parseAsync({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('extends object type with new properties', () => {
    const shape = new ObjectShape({ foo: stringShape }, null).extend({ bar: numberShape });

    expect(shape.shapes).toEqual({
      foo: stringShape,
      bar: numberShape,
    });
    expect(shape.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('merges object type with another object', () => {
    const shape = new ObjectShape({ foo: stringShape }, null).extend(new ObjectShape({ bar: numberShape }, null));

    expect(shape.shapes).toEqual({
      foo: stringShape,
      bar: numberShape,
    });
    expect(shape.parse({ foo: 'aaa', bar: 111 })).toEqual({ foo: 'aaa', bar: 111 });
  });

  test('picks properties from an abject', () => {
    const shape = new ObjectShape({ foo: stringShape, bar: numberShape }, null).pick('foo').strip();

    expect(shape.shapes).toEqual({ foo: stringShape });
    expect(shape.parse({ foo: 'aaa', bar: 'bbb' })).toEqual({ foo: 'aaa' });
  });

  test('omits properties in an abject', () => {
    const shape = new ObjectShape({ foo: stringShape, bar: numberShape }, null).omit('foo').strip();

    expect(shape.shapes).toEqual({ bar: numberShape });
    expect(shape.parse({ foo: 'aaa', bar: 111 })).toEqual({ bar: 111 });
  });

  test('raises issue when a property is absent', () => {
    expect(new ObjectShape({ foo: stringShape, bar: numberShape }, null).validate({ foo: 'aaa' })).toEqual([
      {
        code: CODE_TYPE,
        path: ['bar'],
        input: undefined,
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises issue when a property is absent in async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape, bar: numberShape });

    expect(await shape.validateAsync({ foo: 'aaa' })).toEqual([
      {
        code: CODE_TYPE,
        path: ['bar'],
        input: undefined,
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises issue when an indexer property has invalid type', () => {
    const shape = new ObjectShape({ foo: stringShape }, null).index(stringShape);

    expect(shape.validate({ foo: 'aaa', bar: 111 })).toEqual([
      {
        code: CODE_TYPE,
        path: ['bar'],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises issue when an indexer property has invalid type in async mode', async () => {
    const shape = new ObjectShape({ foo: stringShape }, null).index(asyncStringShape);

    expect(await shape.validateAsync({ foo: 'aaa', bar: 111 })).toEqual([
      {
        code: CODE_TYPE,
        path: ['bar'],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues in the verbose mode', () => {
    const shape = new ObjectShape({ foo: stringShape }, numberShape);

    expect(shape.validate({ foo: 111, bar: 'aaa' }, { verbose: true })).toEqual([
      {
        code: CODE_TYPE,
        path: ['foo'],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        path: ['bar'],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues in the async verbose mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape }, asyncNumberShape);

    expect(await shape.validateAsync({ foo: 111, bar: 'aaa' }, { verbose: true })).toEqual([
      {
        code: CODE_TYPE,
        path: ['foo'],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
      {
        code: CODE_TYPE,
        path: ['bar'],
        input: 'aaa',
        param: TYPE_NUMBER,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises a single issue', () => {
    const shape = new ObjectShape({ foo: stringShape }, numberShape);

    expect(shape.validate({ foo: 111, bar: 'aaa' })).toEqual([
      {
        code: CODE_TYPE,
        path: ['foo'],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('raises multiple issues in the async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape }, asyncNumberShape);

    expect(await shape.validateAsync({ foo: 111, bar: 'aaa' })).toEqual([
      {
        code: CODE_TYPE,
        path: ['foo'],
        input: 111,
        param: TYPE_STRING,
        message: expect.any(String),
        meta: undefined,
      },
    ]);
  });

  test('returns the same object is unchanged', () => {
    const shape = new ObjectShape({ foo: stringShape });
    const input = { foo: 'aaa' };
    const output = shape.parse(input);

    expect(input).toBe(output);
    expect(input).toEqual({ foo: 'aaa' });
  });

  test('returns the same object is unchanged in async mode', async () => {
    const shape = new ObjectShape({ foo: asyncStringShape });
    const input = { foo: 'aaa' };
    const output = await shape.parseAsync(input);

    expect(input).toBe(output);
    expect(input).toEqual({ foo: 'aaa' });
  });

  test('returns the object clone if changed', () => {
    const shape = new ObjectShape({ foo: numberShape.transform(() => 'aaa') });
    const input = { foo: 111 };
    const output = shape.parse(input);

    expect(input).not.toBe(output);
    expect(input).toEqual({ foo: 111 });
    expect(output).toEqual({ foo: 'aaa' });
  });

  test('returns the object clone if changed in async mode', async () => {
    const shape = new ObjectShape({ foo: numberShape.transform(() => 'aaa') });
    const input = { foo: 111 };
    const output = await shape.parseAsync(input);

    expect(input).not.toBe(output);
    expect(input).toEqual({ foo: 111 });
    expect(output).toEqual({ foo: 'aaa' });
  });

  test('returns value type at key', () => {
    const valueShape = numberShape;
    const shape = new ObjectShape({ foo: valueShape });

    expect(shape.at('foo')).toBe(valueShape);
    expect(shape.at('bar')).toBe(null);
  });

  test('returns indexer type at key', () => {
    const indexerShape = stringShape;
    const shape = new ObjectShape({}, indexerShape);

    expect(shape.at('foo')).toBe(indexerShape);
    expect(shape.at('bar')).toBe(indexerShape);
  });

  test('does not swallow unknown errors', () => {
    const shape = new ObjectShape({
      foo: stringShape.constrain(() => {
        throw new Error('Unknown');
      }),
    });

    expect(() => shape.validate({ foo: '' })).toThrow(new Error('Unknown'));
  });

  test('does not swallow unknown errors in the async mode', async () => {
    const shape = new ObjectShape({
      foo: asyncStringShape.constrain(() => {
        throw new Error('Unknown');
      }),
    });

    await expect(shape.validateAsync({ foo: '' })).rejects.toEqual(new Error('Unknown'));
  });
});
