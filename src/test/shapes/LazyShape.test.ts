import {
  ApplyOptions,
  DeepPartialProtocol,
  LazyShape,
  NumberShape,
  ObjectShape,
  Result,
  Shape,
  StringShape,
  ValidationError,
} from '../../main';
import { ERROR_SHAPE_EXPECTED } from '../../main/constants';
import { identity, nextNonce } from '../../main/internal';
import { TYPE_OBJECT } from '../../main/Type';

describe('LazyShape', () => {
  class AsyncShape extends Shape {
    protected _isAsync(): boolean {
      return true;
    }

    protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number) {
      return new Promise<Result>(resolve => {
        resolve(Shape.prototype['_apply'].call(this, input, options, nonce));
      });
    }
  }

  let asyncShape: AsyncShape;

  beforeEach(() => {
    nextNonce.nonce = 0;

    asyncShape = new AsyncShape();
  });

  test('parses values with an underlying shape', () => {
    const shape = new StringShape();
    const lazyShape = new LazyShape(() => shape, identity);

    const applySpy = jest.spyOn<Shape, any>(shape, '_apply');

    expect(lazyShape.isAsync).toBe(false);
    expect(lazyShape.parse('aaa')).toBe('aaa');
    expect(applySpy).toHaveBeenCalledTimes(1);
    expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerce: false }, 0);
  });

  test('applies checks to converted value', () => {
    const checkMock = jest.fn(() => [{ code: 'xxx' }]);

    const shape = new StringShape().convert(parseFloat);
    const lazyShape = new LazyShape(() => shape, identity).check(checkMock);

    expect(lazyShape.try('111')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
    expect(checkMock).toHaveBeenCalledTimes(1);
    expect(checkMock).toHaveBeenNthCalledWith(1, 111, undefined, { verbose: false, coerce: false });
  });

  test('does not apply checks if an underlying shape raises an issue', () => {
    const shape = new Shape().check(() => [{ code: 'xxx' }]);
    const lazyShape = new LazyShape(() => shape, identity).check(() => [{ code: 'yyy' }], { force: true });

    expect(lazyShape.try('aaa', { verbose: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('shape provider is called only once', () => {
    const shape = new NumberShape();
    const shapeProviderMock = jest.fn(() => shape);

    const lazyShape1: LazyShape<any, any> = new LazyShape(shapeProviderMock, identity);
    const lazyShape2 = lazyShape1.check(() => null);

    expect(lazyShape1.shape).toBe(shape);
    expect(lazyShape2.shape).toBe(shape);
    expect(shapeProviderMock).toHaveBeenCalledTimes(1);
  });

  describe('_isAsync', () => {
    test('prevents short circuit', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => lazyShape, identity);

      expect(lazyShape['_isAsync']()).toBe(false);
    });

    test('prevents infinite loop', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => new ObjectShape({ key1: lazyShape }, null), identity);

      expect(lazyShape['_isAsync']()).toBe(false);
    });

    test('returns true if async', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: lazyShape.convertAsync(() => Promise.resolve(111)) }, null),
        identity
      );

      expect(lazyShape['_isAsync']()).toBe(true);
    });
  });

  describe('inputs', () => {
    test('prevents short circuit', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => lazyShape, identity);

      expect(lazyShape.inputs).toEqual([]);
    });

    test('prevents infinite loop', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => new ObjectShape({ key1: lazyShape }, null), identity);

      expect(lazyShape.inputs).toEqual([TYPE_OBJECT]);
    });
  });

  describe('shape', () => {
    test('prevents short circuit', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => lazyShape, identity);

      expect(lazyShape.shape).toBe(lazyShape);
    });

    test('throws an exception on premature access', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => lazyShape.shape, identity);

      expect(() => lazyShape.shape).toThrow(new Error(ERROR_SHAPE_EXPECTED));
    });

    test('throws an exception if shape is accessed from the provider', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => lazyShape.check(() => null).shape, identity);

      expect(() => lazyShape.shape).toThrow(new Error(ERROR_SHAPE_EXPECTED));
    });
  });

  describe('deepPartial', () => {
    test('marks shape as deep partial', () => {
      class MockShape extends Shape implements DeepPartialProtocol<Shape> {
        deepPartial() {
          return deepPartialShape;
        }
      }

      const deepPartialShape = new MockShape();
      const shapeProviderMock = jest.fn(() => new MockShape());

      const shape = new LazyShape(shapeProviderMock, identity).deepPartial();

      expect(shapeProviderMock).not.toHaveBeenCalled();

      expect(shape.shape).toBe(deepPartialShape);
      expect(shapeProviderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cyclic objects', () => {
    test('raises issues', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(
        () => lazyShape,
        () => {
          throw new ValidationError([{ code: 'xxx' }]);
        }
      );

      expect(lazyShape.try(111)).toEqual({ ok: false, issues: [{ code: 'xxx' }] });
    });

    test('parses immediately recursive lazy shape', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => lazyShape, identity);

      expect(lazyShape.parse(111)).toBe(111);
      expect(lazyShape['_stackMap'].size).toBe(0);
    });

    test('parses cyclic shapes', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(() => new ObjectShape({ key1: lazyShape }, null), identity);

      const obj: any = {};
      obj.key1 = obj;

      expect(lazyShape.parse(obj)).toBe(obj);
      expect(lazyShape['_stackMap'].size).toBe(0);
    });

    test('shows issues only for the first input value', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: new ObjectShape({ key2: lazyShape }, null), key3: new StringShape() }, null),
        identity
      );

      const obj: any = {};
      obj.key1 = {};
      obj.key1.key2 = obj;

      expect(lazyShape.try(obj, { verbose: true })).toEqual({
        ok: false,
        issues: [
          {
            code: 'type',
            message: 'Must be a string',
            param: {
              name: 'string',
            },
            path: ['key3'],
          },
        ],
      });
    });

    test('clears stack if an error is thrown', () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(
        () =>
          new ObjectShape(
            {
              key1: lazyShape.check(() => {
                throw new Error('expected');
              }),
            },
            null
          ),
        identity
      );

      const obj: any = {};
      obj.key1 = obj;

      expect(() => lazyShape.parse(obj)).toThrow('expected');
      expect(lazyShape['_stackMap'].size).toBe(0);
      expect(lazyShape.shape.shapes.key1['_stackMap'].size).toBe(0);
    });

    test('nested parse invocations are separated by nonce', () => {
      const checkMock = jest.fn();

      const lazyShape: LazyShape<any, any> = new LazyShape(
        () =>
          lazyShape
            .convert(value => {
              return value !== 111 ? lazyShape.parse(111) : value;
            })
            .check(checkMock),
        identity
      );

      lazyShape.parse(222);

      expect(nextNonce()).toBe(2);
      expect(checkMock).toHaveBeenCalledTimes(2);
      expect(checkMock).toHaveBeenNthCalledWith(1, 111, undefined, { coerce: false, verbose: false });
      expect(checkMock).toHaveBeenNthCalledWith(2, 111, undefined, { coerce: false, verbose: false });
    });
  });

  describe('async', () => {
    test('parses values with an underlying shape', async () => {
      const lazyShape = new LazyShape(() => asyncShape, identity);

      const applySpy = jest.spyOn<Shape, any>(asyncShape, '_applyAsync');

      expect(lazyShape.isAsync).toBe(true);
      await expect(lazyShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applySpy).toHaveBeenCalledTimes(1);
      expect(applySpy).toHaveBeenNthCalledWith(1, 'aaa', { verbose: false, coerce: false }, 0);
    });

    test('clears stack if an error is thrown', async () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(
        () =>
          new ObjectShape(
            {
              key1: lazyShape,
              key2: new AsyncShape(),
            },
            null
          ),
        identity
      ).check(() => {
        throw new Error('expected');
      });
      const obj: any = {};
      obj.key1 = obj;

      await expect(lazyShape.parseAsync(obj)).rejects.toEqual(new Error('expected'));

      expect(lazyShape['_stackMap'].size).toBe(0);
      expect(lazyShape.shape.shapes.key1['_stackMap'].size).toBe(0);
    });

    test('parallel parse calls of cyclic shapes are separated by nonce', async () => {
      const lazyShape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: lazyShape, key2: new AsyncShape() }, null),
        identity
      );

      const applySpy = jest.spyOn<Shape, any>(lazyShape, '_applyAsync');

      const obj1: any = { key2: 'aaa' };
      obj1.key1 = obj1;

      const obj2: any = { key2: 'bbb' };
      obj2.key1 = obj2;

      await Promise.all([lazyShape.parseAsync(obj1), lazyShape.parseAsync(obj2)]);

      expect(applySpy).toHaveBeenCalledTimes(4);
      expect(applySpy).toHaveBeenNthCalledWith(1, obj1, { coerce: false, verbose: false }, 0);
      expect(applySpy).toHaveBeenNthCalledWith(2, obj2, { coerce: false, verbose: false }, 1);
      expect(applySpy).toHaveBeenNthCalledWith(3, obj1, { coerce: false, verbose: false }, 0);
      expect(applySpy).toHaveBeenNthCalledWith(4, obj2, { coerce: false, verbose: false }, 1);
    });
  });
});
