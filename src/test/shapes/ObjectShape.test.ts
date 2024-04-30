import { ObjectShape, Ok, Shape, StringShape } from '../../main';
import {
  CODE_ANY_DENY,
  CODE_OBJECT_EXACT,
  CODE_TYPE,
  CODE_TYPE_ENUM,
  MESSAGE_TYPE_OBJECT,
  MESSAGE_TYPE_STRING,
} from '../../main/constants';
import { resetNonce } from '../../main/internal/shapes';
import { Type } from '../../main/Type';
import { AsyncMockShape, MockShape } from './mocks';

describe('ObjectShape', () => {
  beforeEach(() => {
    resetNonce();
  });

  test('creates an ObjectShape', () => {
    const propShapes = { key1: new Shape() };
    const restShape = new Shape();

    const shape = new ObjectShape(propShapes, restShape);

    expect(shape.keysMode).toBe('preserved');
    expect(shape.keys).toEqual(['key1']);
    expect(shape.restShape).toBe(restShape);
    expect(shape.propShapes).toBe(propShapes);
    expect(shape.isAsync).toBe(false);
    expect(shape.inputs).toEqual([Type.OBJECT]);
  });

  test('raises an issue for a non-object input value', () => {
    const restShape = new Shape();

    const shape = new ObjectShape({}, restShape);

    expect(shape.try('')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_TYPE_OBJECT, param: Type.OBJECT }],
    });
  });

  describe('rest', () => {
    test('adds rest signature', () => {
      const restShape = new Shape();

      const shape1 = new ObjectShape({}, null).check(() => null);
      const shape2 = shape1.rest(restShape);

      expect(shape1.operations.length).toBe(1);
      expect(shape1.restShape).toBeNull();
      expect(shape1.keysMode).toBe('preserved');

      expect(shape2).not.toBe(shape1);
      expect(shape2.operations.length).toBe(1);
      expect(shape2.restShape).toBe(restShape);
      expect(shape2.keysMode).toBe('preserved');
    });
  });

  describe('exact', () => {
    test('sets exact keys mode', () => {
      const shape1 = new ObjectShape({}, null).check(() => null);
      const shape2 = shape1.exact();

      expect(shape2).not.toBe(shape1);
      expect(shape2.operations.length).toBe(1);
      expect(shape2.keysMode).toBe('exact');
    });
  });

  describe('strip', () => {
    test('sets stripped keys mode', () => {
      const shape1 = new ObjectShape({}, null).check(() => null);
      const shape2 = shape1.strip();

      expect(shape2).not.toBe(shape1);
      expect(shape2.operations.length).toBe(1);
      expect(shape2.keysMode).toBe('stripped');
    });
  });

  describe('preserve', () => {
    test('sets preserved keys mode', () => {
      const shape1 = new ObjectShape({}, null).strip().check(() => null);
      const shape2 = shape1.preserve();

      expect(shape1.operations.length).toBe(1);
      expect(shape1.restShape).toBeNull();
      expect(shape1.keysMode).toBe('stripped');

      expect(shape2).not.toBe(shape1);
      expect(shape2.operations.length).toBe(1);
      expect(shape2.keysMode).toBe('preserved');
    });
  });

  describe('keysShape', () => {
    test('returns an enum of keys', () => {
      const keysShape = new ObjectShape({ key1: new Shape(), key2: new Shape() }, null).keysShape;

      expect(keysShape.try('key1')).toEqual({ ok: true, value: 'key1' });
      expect(keysShape.try('key2')).toEqual({ ok: true, value: 'key2' });
      expect(keysShape.try('xxx')).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE_ENUM,
            input: 'xxx',
            message: 'Must be equal to one of key1, key2',
            param: ['key1', 'key2'],
          },
        ],
      });
    });

    test('returns the same shape every time', () => {
      const shape = new ObjectShape({ key1: new Shape(), key2: new Shape() }, null);

      expect(shape.keysShape).toBe(shape.keysShape);
    });
  });

  describe('pick', () => {
    test('picks properties', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();

      const shape1 = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null);
      const shape2 = shape1.pick(['key1']);

      expect(shape2).not.toBe(shape1);
      expect(shape2.propShapes).toEqual({ key1: valueShape1 });
    });
  });

  describe('omit', () => {
    test('omits properties', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();

      const shape1 = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null);
      const shape2 = shape1.omit(['key1']);

      expect(shape2).not.toBe(shape1);
      expect(shape2.propShapes).toEqual({ key2: valueShape2 });
    });
  });

  describe('extend', () => {
    test('extends object with properties', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();

      const shape1 = new ObjectShape({ key1: valueShape1 }, null).strip().refine(() => true);
      const shape2 = shape1.extend({ key2: valueShape2 });

      expect(shape2).not.toBe(shape1);
      expect(shape2.propShapes).toEqual({ key1: valueShape1, key2: valueShape2 });
      expect(shape2.keys).toEqual(['key1', 'key2']);
      expect(shape2.keysMode).toBe('stripped');
    });

    test('extends object with properties from another object and preserves rest shape', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();

      const restShape1 = new Shape();
      const restShape2 = new Shape();

      const shape1 = new ObjectShape({ key1: valueShape1 }, restShape1).refine(() => true);
      const shape2 = shape1.extend(new ObjectShape({ key2: valueShape2 }, restShape2));

      expect(shape2).not.toBe(shape1);
      expect(shape2.propShapes).toEqual({ key1: valueShape1, key2: valueShape2 });
      expect(shape2.keys).toEqual(['key1', 'key2']);
      expect(shape2.keysMode).toBe('preserved');
      expect(shape2.restShape).toBe(restShape1);
    });

    test('overwrites extended properties', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();

      const shape1 = new ObjectShape({ key1: valueShape1 }, null);
      const shape2 = shape1.extend({ key1: valueShape2 });

      expect(shape2).not.toBe(shape1);
      expect(shape2.propShapes).toEqual({ key1: valueShape2 });
      expect(shape2.keys).toEqual(['key1']);
    });
  });

  describe('partial', () => {
    test('marks all properties optional', () => {
      const valueShape1 = new StringShape();
      const valueShape2 = new StringShape();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null).partial();
      const input = {};

      expect(shape.try(input, { earlyReturn: true })).toEqual({ ok: true, value: input });
    });

    test('marks all properties with given keys as optional', () => {
      const valueShape1 = new StringShape();
      const valueShape2 = new StringShape();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null).partial(['key2']);
      const input = {};

      expect(shape.try(input, { earlyReturn: true })).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, message: MESSAGE_TYPE_STRING, param: Type.STRING, path: ['key1'] }],
      });
    });
  });

  describe('required', () => {
    test('marks all properties required', () => {
      const valueShape1 = new StringShape().optional();
      const valueShape2 = new StringShape().optional();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null).required();
      const input = {};

      expect(shape.try(input)).toEqual({
        ok: false,
        issues: [
          { code: CODE_ANY_DENY, message: 'Must not be equal to undefined', path: ['key1'] },
          { code: CODE_ANY_DENY, message: 'Must not be equal to undefined', path: ['key2'] },
        ],
      });
    });

    test('marks all properties with given keys as required', () => {
      const valueShape1 = new StringShape().optional();
      const valueShape2 = new StringShape().optional();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null).required(['key1']);
      const input = {};

      expect(shape.try(input, { earlyReturn: true })).toEqual({
        ok: false,
        issues: [{ code: CODE_ANY_DENY, message: 'Must not be equal to undefined', path: ['key1'] }],
      });
    });
  });

  describe('at', () => {
    test('returns property shape at key', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null);

      expect(shape.at('key1')).toBe(valueShape1);
      expect(shape.at('key2')).toBe(valueShape2);
      expect(shape.at('xxx')).toBeNull();
    });
  });

  describe('deepPartial', () => {
    test('parses deep partial properties', () => {
      const shape = new ObjectShape({ key1: new ObjectShape({ key2: new StringShape() }, null) }, null).deepPartial();

      expect(shape.parse({})).toEqual({});
      expect(shape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(shape.parse({ key1: {} })).toEqual({ key1: {} });
      expect(shape.parse({ key1: { key2: undefined } })).toEqual({ key1: { key2: undefined } });
      expect(shape.parse({ key1: { key2: 'aaa' } })).toEqual({ key1: { key2: 'aaa' } });

      expect(shape.try({ key1: { key2: 111 } })).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE,
            input: 111,
            message: MESSAGE_TYPE_STRING,
            param: Type.STRING,
            path: ['key1', 'key2'],
          },
        ],
      });
    });

    test('parses deep partial rest properties', () => {
      const shape = new ObjectShape({}, new ObjectShape({ key2: new StringShape() }, null)).deepPartial();

      expect(shape.parse({})).toEqual({});
      expect(shape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(shape.parse({ key1: {} })).toEqual({ key1: {} });
      expect(shape.parse({ key1: { key2: undefined } })).toEqual({ key1: { key2: undefined } });
      expect(shape.parse({ key1: { key2: 'aaa' } })).toEqual({ key1: { key2: 'aaa' } });

      expect(shape.try({ key1: { key2: 111 } })).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE,
            input: 111,
            message: MESSAGE_TYPE_STRING,
            param: Type.STRING,
            path: ['key1', 'key2'],
          },
        ],
      });
    });
  });

  describe('_applyRestUnchecked', () => {
    test('checks known keys', () => {
      const valueShape1 = new MockShape();

      const shape = new ObjectShape({ key1: valueShape1 }, null);

      const input = { key1: 'aaa' };

      const result = shape.try(input) as Ok;

      expect(result).toEqual({ ok: true, value: input });
      expect(result.value).toBe(input);
      expect(valueShape1._apply).toHaveBeenCalledTimes(1);
      expect(valueShape1._apply).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false }, 0);
    });

    test('raises the first issue only in an early-return mode', () => {
      const valueShape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const valueShape2 = new Shape().check(() => [{ code: 'yyy' }]);

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null);

      const result = shape.try({}, { earlyReturn: true }) as Ok;

      expect(result).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('raises multiple issues', () => {
      const valueShape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const valueShape2 = new Shape().check(() => [{ code: 'yyy' }]);

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null);

      const result = shape.try({}) as Ok;

      expect(result).toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'yyy', path: ['key2'] },
        ],
      });
    });

    test('clones the object if a property value is changed', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape().convert(() => 111);

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, null);

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = shape.try(input) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', key2: 111 } });
      expect(result.value).not.toBe(input);
    });

    test('safely assigns __proto__', () => {
      const valueShape1 = new Shape().convert(() => 111);

      const propShapes = Object.defineProperty({}, '__proto__', { value: valueShape1, enumerable: true });

      const shape = new ObjectShape(propShapes, null);

      const input = {};

      const result = shape.try(input) as Ok<object>;

      expect(result).toEqual({
        ok: true,
        value: Object.defineProperty({}, '__proto__', { value: 111, enumerable: true }),
      });
      expect(result.value).not.toBe(input);
      expect(result.value.hasOwnProperty('__proto__')).toBe(true);
    });

    test('applies operations', () => {
      const shape = new ObjectShape({}, null).check(() => [{ code: 'xxx' }]);

      expect(shape.try({})).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });

  describe('_applyRestChecked', () => {
    test('checks both known keys and indexed keys', () => {
      const valueShape1 = new MockShape();
      const valueShape2 = new MockShape();
      const restShape = new MockShape();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, restShape);

      const input = { key1: 'aaa', key3: 'bbb' };

      const result = shape.try(input) as Ok;

      expect(result).toEqual({ ok: true, value: input });
      expect(result.value).toBe(input);
      expect(valueShape1._apply).toHaveBeenCalledTimes(1);
      expect(valueShape1._apply).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false }, 0);
      expect(valueShape2._apply).toHaveBeenCalledTimes(1);
      expect(valueShape2._apply).toHaveBeenNthCalledWith(1, undefined, { earlyReturn: false }, 0);
      expect(restShape._apply).toHaveBeenCalledTimes(1);
      expect(restShape._apply).toHaveBeenNthCalledWith(1, 'bbb', { earlyReturn: false }, 0);
    });

    test('raises multiple issues', () => {
      const valueShape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const restShape = new Shape().check(() => [{ code: 'yyy' }]);

      const shape = new ObjectShape({ key1: valueShape1 }, restShape);

      const result = shape.try({ key2: 'aaa' }) as Ok;

      expect(result).toEqual({
        ok: false,
        issues: [
          { code: 'yyy', path: ['key2'] },
          { code: 'xxx', path: ['key1'] },
        ],
      });
    });

    test('clones the object if an indexed property value is changed', () => {
      const valueShape1 = new Shape();
      const restShape = new Shape().convert(() => 111);

      const shape = new ObjectShape({ key1: valueShape1 }, restShape);

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = shape.try(input) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', key2: 111 } });
      expect(result.value).not.toBe(input);
    });

    test('strip removes rest shape', () => {
      const shape = new ObjectShape({}, new Shape()).strip();

      expect(shape.restShape).toBeNull();
    });

    test('strips unknown properties', () => {
      const valueShape1 = new Shape();

      const shape = new ObjectShape({ key1: valueShape1 }, null).strip();

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = shape.try(input) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 'aaa' } });
      expect(result.value).not.toBe(input);
    });

    test('strips unknown properties if property value has changed', () => {
      const valueShape1 = new Shape().convert(() => 111);

      const shape = new ObjectShape({ key1: valueShape1 }, null).strip();

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = shape.try(input) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 111 } });
      expect(result.value).not.toBe(input);
    });

    test('raises an issue if unknown property is encountered in an early-return mode', () => {
      const valueShape1 = new Shape();

      const shape = new ObjectShape({ key1: valueShape1 }, null).exact();

      const input = { key1: 'aaa', key2: 'bbb', key3: 'ccc' };

      const result = shape.try(input, { earlyReturn: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_OBJECT_EXACT,
            input,
            message: 'Must not have unknown keys: key2',
            param: ['key2'],
          },
        ],
      });
    });

    test('raises an issue if with all unknown properties', () => {
      const valueShape1 = new Shape();

      const shape = new ObjectShape({ key1: valueShape1 }, null).exact();

      const input = { key1: 'aaa', key2: 'bbb', key3: 'ccc' };

      const result = shape.try(input);

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_OBJECT_EXACT,
            input,
            message: 'Must not have unknown keys: key2,key3',
            param: ['key2', 'key3'],
          },
        ],
      });
    });

    test('applies operations', () => {
      const shape = new ObjectShape({}, new Shape()).check(() => [{ code: 'xxx' }]);

      expect(shape.try({})).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });

  describe('async', () => {
    test('raises an issue for a non-object input value', async () => {
      const shape = new ObjectShape({}, new AsyncMockShape());

      await expect(shape.tryAsync('')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_TYPE_OBJECT, param: Type.OBJECT }],
      });
    });

    test('checks both known keys and indexed keys', async () => {
      const valueShape1 = new AsyncMockShape();
      const valueShape2 = new MockShape();
      const restShape = new MockShape();

      const shape = new ObjectShape({ key1: valueShape1, key2: valueShape2 }, restShape);

      const input = { key1: 'aaa', key3: 'bbb' };

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: input });
      expect(result.value).toBe(input);
      expect(valueShape1._applyAsync).toHaveBeenCalledTimes(1);
      expect(valueShape1._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false }, 0);
      expect(valueShape2._apply).toHaveBeenCalledTimes(1);
      expect(valueShape2._apply).toHaveBeenNthCalledWith(1, undefined, { earlyReturn: false }, 0);
      expect(restShape._apply).toHaveBeenCalledTimes(1);
      expect(restShape._apply).toHaveBeenNthCalledWith(1, 'bbb', { earlyReturn: false }, 0);
    });

    test('raises multiple issues', async () => {
      const valueShape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const restShape = new AsyncMockShape().check(() => [{ code: 'yyy' }]);

      const shape = new ObjectShape({ key1: valueShape1 }, restShape);

      const result = await shape.tryAsync({ key2: 'aaa' });

      expect(result).toEqual({
        ok: false,
        issues: [
          { code: 'yyy', path: ['key2'] },
          { code: 'xxx', path: ['key1'] },
        ],
      });
    });

    test('clones the object if an indexed property value is changed', async () => {
      const valueShape1 = new Shape();
      const restShape = new Shape().convertAsync(() => Promise.resolve(111));

      const shape = new ObjectShape({ key1: valueShape1 }, restShape);

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', key2: 111 } });
      expect(result.value).not.toBe(input);
    });

    test('strips unknown properties', async () => {
      const shape = new ObjectShape({ key1: new AsyncMockShape() }, null).strip();

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 'aaa' } });
      expect(result.value).not.toBe(input);
    });

    test('strips unknown properties if property value has changed', async () => {
      const valueShape1 = new Shape().convertAsync(() => Promise.resolve(111));

      const shape = new ObjectShape({ key1: valueShape1 }, null).strip();

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 111 } });
      expect(result.value).not.toBe(input);
    });

    test('raises an issue if unknown property is encountered in an early-return mode', async () => {
      const shape = new ObjectShape({ key1: new AsyncMockShape() }, null).exact();

      const input = { key1: 'aaa', key2: 'bbb', key3: 'ccc' };

      const result = await shape.tryAsync(input, { earlyReturn: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_OBJECT_EXACT,
            input,
            message: 'Must not have unknown keys: key2',
            param: ['key2'],
          },
        ],
      });
    });

    test('raises an issue if with all unknown properties', async () => {
      const shape = new ObjectShape({ key1: new AsyncMockShape() }, null).exact();

      const input = { key1: 'aaa', key2: 'bbb', key3: 'ccc' };

      const result = await shape.tryAsync(input);

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_OBJECT_EXACT,
            input,
            message: 'Must not have unknown keys: key2,key3',
            param: ['key2', 'key3'],
          },
        ],
      });
    });

    test('applies operations', async () => {
      const shape = new ObjectShape({}, new AsyncMockShape()).check(() => [{ code: 'xxx' }]);

      const result = await shape.tryAsync({});

      expect(result).toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow errors', async () => {
      const shape = new ObjectShape(
        {
          aaa: new AsyncMockShape(),
          bbb: new AsyncMockShape().check(() => {
            throw new Error('expected');
          }),
        },
        null
      );

      await expect(shape.tryAsync({ aaa: 111, bbb: 222 })).rejects.toEqual(new Error('expected'));
    });
  });
});
