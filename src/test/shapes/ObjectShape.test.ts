import { ObjectShape, Shape, StringShape } from '../../main';
import {
  CODE_ENUM,
  CODE_EXCLUSION,
  CODE_TYPE,
  CODE_UNKNOWN_KEYS,
  MESSAGE_OBJECT_TYPE,
  MESSAGE_STRING_TYPE,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../../main/constants';

describe('ObjectShape', () => {
  test('raises non object values', () => {
    const restShape = new Shape();

    const objShape = new ObjectShape({}, restShape);

    expect(objShape.try('')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_OBJECT_TYPE, param: TYPE_OBJECT, path: [] }],
    });
  });

  test('creates a shape', () => {
    const shapes = { foo: new Shape() };
    const restShape = new Shape();

    const objShape = new ObjectShape(shapes, restShape);

    expect(objShape.keysMode).toBe('preserved');
    expect(objShape.keys).toEqual(['foo']);
    expect(objShape.restShape).toBe(restShape);
    expect(objShape.shapes).toBe(shapes);
    expect(objShape.async).toBe(false);
  });

  test('adds rest signature', () => {
    const restShape = new Shape();
    const objShape1 = new ObjectShape({}, null).refine(() => true);
    const objShape2 = objShape1.rest(restShape);

    expect(objShape1.checks.length).toBe(1);
    expect(objShape1.restShape).toBe(null);
    expect(objShape1.keysMode).toBe('preserved');
    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.restShape).toBe(restShape);
    expect(objShape2.keysMode).toBe('preserved');
  });

  test('sets exact key mode', () => {
    const objShape1 = new ObjectShape({}, null).refine(() => true);
    const objShape2 = objShape1.exact();

    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.keysMode).toBe('exact');
  });

  test('sets stripped key mode', () => {
    const objShape1 = new ObjectShape({}, null).refine(() => true);
    const objShape2 = objShape1.strip();

    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.keysMode).toBe('stripped');
  });

  test('sets preserved key mode', () => {
    const objShape1 = new ObjectShape({}, null).strip().refine(() => true);
    const objShape2 = objShape1.preserve();

    expect(objShape1.checks.length).toBe(1);
    expect(objShape1.restShape).toBe(null);
    expect(objShape1.keysMode).toBe('stripped');
    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.keysMode).toBe('preserved');
  });

  test('returns an enum of keys', () => {
    const objShape = new ObjectShape({ key1: new Shape(), key2: new Shape() }, null).keyof();

    expect(objShape.try('key1')).toEqual({ ok: true, value: 'key1' });
    expect(objShape.try('key2')).toEqual({ ok: true, value: 'key2' });
    expect(objShape.try('xxx')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_ENUM,
          input: 'xxx',
          message: 'Must be equal to one of: key1,key2',
          param: ['key1', 'key2'],
          path: [],
        },
      ],
    });
  });

  test('picks properties', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const objShape1 = new ObjectShape({ key1: shape1, key2: shape2 }, null);
    const objShape2 = objShape1.pick(['key1']);

    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.shapes).toEqual({ key1: shape1 });
  });

  test('omits properties', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const objShape1 = new ObjectShape({ key1: shape1, key2: shape2 }, null);
    const objShape2 = objShape1.omit(['key1']);

    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.shapes).toEqual({ key2: shape2 });
  });

  test('extends object with properties', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const objShape1 = new ObjectShape({ key1: shape1 }, null).strip().refine(() => true);
    const objShape2 = objShape1.extend({ key2: shape2 });

    expect(objShape1.checks.length).toBe(1);
    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.shapes).toEqual({ key1: shape1, key2: shape2 });
    expect(objShape2.keys).toEqual(['key1', 'key2']);
    expect(objShape2.keysMode).toBe('stripped');
  });

  test('extends object with properties from another object and preserves rest shape', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const restShape1 = new Shape();
    const restShape2 = new Shape();

    const objShape1 = new ObjectShape({ key1: shape1 }, restShape1).refine(() => true);
    const objShape2 = objShape1.extend(new ObjectShape({ key2: shape2 }, restShape2));

    expect(objShape1.checks.length).toBe(1);
    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.shapes).toEqual({ key1: shape1, key2: shape2 });
    expect(objShape2.keys).toEqual(['key1', 'key2']);
    expect(objShape2.keysMode).toBe('preserved');
    expect(objShape2.restShape).toBe(restShape1);
  });

  test('overwrites extended properties', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const objShape1 = new ObjectShape({ key1: shape1 }, null);
    const objShape2 = objShape1.extend({ key1: shape2 });

    expect(objShape2).not.toBe(objShape1);
    expect(objShape2.checks.length).toBe(0);
    expect(objShape2.shapes).toEqual({ key1: shape2 });
    expect(objShape2.keys).toEqual(['key1']);
  });

  test('returns property shape at key', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

    expect(objShape.at('key1')).toBe(shape1);
    expect(objShape.at('key2')).toBe(shape2);
    expect(objShape.at('xxx')).toBe(null);
  });

  test('marks all properties optional', () => {
    const shape1 = new StringShape();
    const shape2 = new StringShape();

    const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null).partial();
    const obj = {};

    expect(objShape.try(obj, { verbose: true })).toEqual({ ok: true, value: obj });
  });

  test('marks all properties with given keys as optional', () => {
    const shape1 = new StringShape();
    const shape2 = new StringShape();

    const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null).partial(['key2']);
    const obj = {};

    expect(objShape.try(obj, { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: ['key1'] }],
    });
  });

  test('marks all properties required', () => {
    const shape1 = new StringShape().optional();
    const shape2 = new StringShape().optional();

    const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null).required();
    const obj = {};

    expect(objShape.try(obj, { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: CODE_EXCLUSION, message: 'Must not be equal to undefined', path: ['key1'] },
        { code: CODE_EXCLUSION, message: 'Must not be equal to undefined', path: ['key2'] },
      ],
    });
  });

  test('marks all properties with given keys as required', () => {
    const shape1 = new StringShape().optional();
    const shape2 = new StringShape().optional();

    const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null).required(['key1']);
    const obj = {};

    expect(objShape.try(obj, { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: CODE_EXCLUSION, message: 'Must not be equal to undefined', path: ['key1'] }],
    });
  });

  describe('lax', () => {
    test('checks known keys', () => {
      const shape1 = new Shape();
      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');

      const objShape = new ObjectShape({ key1: shape1 }, null);

      const obj = { key1: 'aaa' };
      const result: any = objShape.try(obj);

      expect(result).toEqual({ ok: true, value: obj });
      expect(result.value).toBe(obj);
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
    });

    test('raises the first issue only', () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

      const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

      const result: any = objShape.try({});

      expect(result).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('raises multiple issues in verbose mode', () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

      const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

      const result: any = objShape.try({}, { verbose: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'yyy', path: ['key2'] },
        ],
      });
    });

    test('clones the object if a property value is changed', () => {
      const shape1 = new Shape();
      const shape2 = new Shape().transform(() => 111);

      const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

      const obj = { key1: 'aaa', key2: 'bbb' };
      const result: any = objShape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', key2: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('safely assigns __proto__', () => {
      const shape1 = new Shape().transform(() => 111);

      const shapes = Object.defineProperty({}, '__proto__', { value: shape1, enumerable: true });

      const objShape = new ObjectShape(shapes, null);

      const obj = {};
      const result: any = objShape.try(obj);

      expect(result).toEqual({
        ok: true,
        value: Object.defineProperty({}, '__proto__', { value: 111, enumerable: true }),
      });
      expect(result.value).not.toBe(obj);
      expect(result.value.hasOwnProperty('__proto__')).toBe(true);
    });

    test('applies checks', () => {
      const objShape = new ObjectShape({}, null).check(() => [{ code: 'xxx' }]);

      expect(objShape.try({})).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });

  describe('strict', () => {
    test('checks both known keys and indexed keys', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const restShape = new Shape();

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
      const restApplySpy = jest.spyOn<Shape, any>(restShape, '_apply');

      const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, restShape);

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = objShape.try(obj);

      expect(result).toEqual({ ok: true, value: obj });
      expect(result.value).toBe(obj);
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy2).toHaveBeenNthCalledWith(1, undefined, { verbose: false });
      expect(restApplySpy).toHaveBeenCalledTimes(1);
      expect(restApplySpy).toHaveBeenNthCalledWith(1, 'bbb', { verbose: false });
    });

    test('raises multiple issues in verbose mode', () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const restShape = new Shape().check(() => [{ code: 'yyy' }]);

      const objShape = new ObjectShape({ key1: shape1 }, restShape);

      const result: any = objShape.try({ key2: 'aaa' }, { verbose: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          { code: 'yyy', path: ['key2'] },
          { code: 'xxx', path: ['key1'] },
        ],
      });
    });

    test('clones the object if an indexed property value is changed', () => {
      const shape1 = new Shape();
      const restShape = new Shape().transform(() => 111);

      const objShape = new ObjectShape({ key1: shape1 }, restShape);

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = objShape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', yay: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('strip removes rest shape', () => {
      const objShape = new ObjectShape({}, new Shape()).strip();

      expect(objShape.restShape).toBe(null);
    });

    test('strips unknown properties', () => {
      const shape1 = new Shape();

      const objShape = new ObjectShape({ key1: shape1 }, null).strip();

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = objShape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa' } });
      expect(result.value).not.toBe(obj);
    });

    test('strips unknown properties if property value has changed', () => {
      const shape1 = new Shape().transform(() => 111);

      const objShape = new ObjectShape({ key1: shape1 }, null).strip();

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = objShape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('raises an issue if unknown property is encountered', () => {
      const shape1 = new Shape();

      const objShape = new ObjectShape({ key1: shape1 }, null).exact();

      const obj = { key1: 'aaa', yay: 'bbb', wow: 'ccc' };
      const result = objShape.try(obj);

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNKNOWN_KEYS,
            input: obj,
            message: 'Must not have unknown keys: yay',
            param: ['yay'],
            path: [],
          },
        ],
      });
    });

    test('raises an issue if with all unknown properties in verbose mode', () => {
      const shape1 = new Shape();

      const objShape = new ObjectShape({ key1: shape1 }, null).exact();

      const obj = { key1: 'aaa', yay: 'bbb', wow: 'ccc' };
      const result = objShape.try(obj, { verbose: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNKNOWN_KEYS,
            input: obj,
            message: 'Must not have unknown keys: yay,wow',
            param: ['yay', 'wow'],
            path: [],
          },
        ],
      });
    });

    test('applies checks', () => {
      const objShape = new ObjectShape({}, new Shape()).check(() => [{ code: 'xxx' }]);

      expect(objShape.try({})).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });

  describe('async', () => {
    test('raises non array values', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new ObjectShape({}, restShape);

      expect(await objShape.tryAsync('')).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_OBJECT_TYPE, param: TYPE_OBJECT, path: [] }],
      });
    });

    test('checks both known keys and indexed keys', async () => {
      const shape1 = new Shape().transformAsync(value => Promise.resolve(value));
      const shape2 = new Shape();
      const restShape = new Shape();

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const restApplySpy = jest.spyOn<Shape, any>(restShape, '_applyAsync');

      const objShape = new ObjectShape({ key1: shape1, key2: shape2 }, restShape);

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = await objShape.tryAsync(obj);

      expect(result).toEqual({ ok: true, value: obj });
      expect(result.value).toBe(obj);
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy2).toHaveBeenNthCalledWith(1, undefined, { verbose: false });
      expect(restApplySpy).toHaveBeenCalledTimes(1);
      expect(restApplySpy).toHaveBeenNthCalledWith(1, 'bbb', { verbose: false });
    });

    test('raises multiple issues in verbose mode', async () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const restShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'yyy' }]);

      const objShape = new ObjectShape({ key1: shape1 }, restShape);

      const result = await objShape.tryAsync({ key2: 'aaa' }, { verbose: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          { code: 'yyy', path: ['key2'] },
          { code: 'xxx', path: ['key1'] },
        ],
      });
    });

    test('clones the object if an indexed property value is changed', async () => {
      const shape1 = new Shape();
      const restShape = new Shape().transformAsync(() => Promise.resolve(111));

      const objShape = new ObjectShape({ key1: shape1 }, restShape);

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = await objShape.tryAsync(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', yay: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('strips unknown properties', async () => {
      const shape1 = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new ObjectShape({ key1: shape1 }, null).strip();

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = await objShape.tryAsync(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa' } });
      expect(result.value).not.toBe(obj);
    });

    test('strips unknown properties if property value has changed', async () => {
      const shape1 = new Shape().transformAsync(() => Promise.resolve(111));

      const objShape = new ObjectShape({ key1: shape1 }, null).strip();

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = await objShape.tryAsync(obj);

      expect(result).toEqual({ ok: true, value: { key1: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('raises an issue if unknown property is encountered', async () => {
      const shape1 = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new ObjectShape({ key1: shape1 }, null).exact();

      const obj = { key1: 'aaa', yay: 'bbb', wow: 'ccc' };
      const result = await objShape.tryAsync(obj);

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNKNOWN_KEYS,
            input: obj,
            message: 'Must not have unknown keys: yay',
            param: ['yay'],
            path: [],
          },
        ],
      });
    });

    test('raises an issue if with all unknown properties in verbose mode', async () => {
      const shape1 = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new ObjectShape({ key1: shape1 }, null).exact();

      const obj = { key1: 'aaa', yay: 'bbb', wow: 'ccc' };
      const result = await objShape.tryAsync(obj, { verbose: true });

      expect(result).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNKNOWN_KEYS,
            input: obj,
            message: 'Must not have unknown keys: yay,wow',
            param: ['yay', 'wow'],
            path: [],
          },
        ],
      });
    });

    test('applies checks', async () => {
      const restShape = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new ObjectShape({}, restShape).check(() => [{ code: 'xxx' }]);

      const result = await objShape.tryAsync({});

      expect(result).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });
});
