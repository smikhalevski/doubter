import { ObjectShape, Shape } from '../../main';
import { CODE_UNKNOWN_KEYS } from '../../main/constants';

describe('ObjectShape', () => {
  test('creates a shape', () => {
    const shapes = { foo: new Shape() };
    const restShape = new Shape();

    const shape = new ObjectShape(shapes, restShape);

    expect(shape.keysMode).toBe('preserved');
    expect(shape.keys).toEqual(['foo']);
    expect(shape.restShape).toBe(restShape);
    expect(shape.shapes).toBe(shapes);
    expect(shape.async).toBe(false);
  });

  describe('lax keys', () => {
    test('checks known keys', () => {
      const shape1 = new Shape();
      const applySpy1 = jest.spyOn(shape1, 'apply');

      const shape = new ObjectShape({ key1: shape1 }, null);

      const obj = { key1: 'aaa' };
      const result: any = shape.try(obj);

      expect(result).toEqual({ ok: true, value: obj });
      expect(result.value).toBe(obj);
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
    });

    test('raises the first issue only', () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

      const shape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

      const result: any = shape.try({});

      expect(result).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('raises multiple issues in verbose mode', () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

      const shape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

      const result: any = shape.try({}, { verbose: true });

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

      const shape = new ObjectShape({ key1: shape1, key2: shape2 }, null);

      const obj = { key1: 'aaa', key2: 'bbb' };
      const result: any = shape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', key2: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('safely assigns __proto__', () => {
      const shape1 = new Shape().transform(() => 111);

      const shapes = Object.defineProperty({}, '__proto__', { value: shape1, enumerable: true });

      const shape = new ObjectShape(shapes, null);

      const obj = {};
      const result: any = shape.try(obj);

      expect(result).toEqual({
        ok: true,
        value: Object.defineProperty({}, '__proto__', { value: 111, enumerable: true }),
      });
      expect(result.value).not.toBe(obj);
      expect(result.value.hasOwnProperty('__proto__')).toBe(true);
    });

    test('applies checks', () => {
      const shape = new ObjectShape({}, null).check(() => [{ code: 'xxx' }]);

      expect(shape.try({})).toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });

  describe('strict keys', () => {
    test('checks both known keys and indexed keys', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const restShape = new Shape();

      const applySpy1 = jest.spyOn(shape1, 'apply');
      const applySpy2 = jest.spyOn(shape2, 'apply');
      const restApplySpy = jest.spyOn(restShape, 'apply');

      const shape = new ObjectShape({ key1: shape1, key2: shape2 }, restShape);

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = shape.try(obj);

      expect(result).toEqual({ ok: true, value: obj });
      expect(result.value).toBe(obj);
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy1).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false });
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy2).toHaveBeenNthCalledWith(1, undefined, { verbose: false });
      expect(restApplySpy).toHaveBeenCalledTimes(1);
      expect(restApplySpy).toHaveBeenNthCalledWith(1, 'bbb', { verbose: false });
    });

    test('clones the object if an indexed property value is changed', () => {
      const shape1 = new Shape();
      const restShape = new Shape().transform(() => 111);

      const shape = new ObjectShape({ key1: shape1 }, restShape);

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = shape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa', yay: 111 } });
      expect(result.value).not.toBe(obj);
    });

    test('strip removes rest shape', () => {
      const shape = new ObjectShape({}, new Shape()).strip();

      expect(shape.restShape).toBe(null);
    });

    test('strips unknown properties', () => {
      const shape1 = new Shape();

      const shape = new ObjectShape({ key1: shape1 }, null).strip();

      const obj = { key1: 'aaa', yay: 'bbb' };
      const result: any = shape.try(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'aaa' } });
      expect(result.value).not.toBe(obj);
    });

    test('raises an issue if unknown property is encountered', () => {
      const shape1 = new Shape();

      const shape = new ObjectShape({ key1: shape1 }, null).exact();

      const obj = { key1: 'aaa', yay: 'bbb', wow: 'ccc' };
      const result = shape.try(obj);

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

      const shape = new ObjectShape({ key1: shape1 }, null).exact();

      const obj = { key1: 'aaa', yay: 'bbb', wow: 'ccc' };
      const result = shape.try(obj, { verbose: true });

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
  });
});
