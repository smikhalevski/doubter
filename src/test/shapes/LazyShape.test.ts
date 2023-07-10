import {
  DeepPartialProtocol,
  LazyShape,
  NumberShape,
  ObjectShape,
  Shape,
  StringShape,
  ValidationError,
} from '../../main';
import { ERROR_SHAPE_EXPECTED } from '../../main/constants';
import { identity, nextNonce, resetNonce } from '../../main/internal';
import { TYPE_OBJECT } from '../../main/Type';
import { AsyncMockShape, MockShape, spyOnShape } from './mocks';

describe('LazyShape', () => {
  beforeEach(() => {
    resetNonce();
  });

  test('parses values with the provided shape', () => {
    const providedShape = new MockShape();
    const shape = new LazyShape(() => providedShape, identity);

    expect(shape.isAsync).toBe(false);
    expect(shape.parse('aaa')).toBe('aaa');
    expect(providedShape._apply).toHaveBeenCalledTimes(1);
    expect(providedShape._apply).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false, coerce: false }, 0);
  });

  test('applies operations to converted value', () => {
    const cbMock = jest.fn(() => [{ code: 'xxx' }]);

    const providedShape = new StringShape().convert(parseFloat);
    const shape = new LazyShape(() => providedShape, identity).check(cbMock);

    expect(shape.try('111')).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
    expect(cbMock).toHaveBeenCalledTimes(1);
    expect(cbMock).toHaveBeenNthCalledWith(1, 111, undefined, { earlyReturn: false, coerce: false });
  });

  test('does not apply operations if the provided shape raises an issue', () => {
    const providedShape = new Shape().check(() => [{ code: 'xxx' }]);
    const shape = new LazyShape(() => providedShape, identity).check(() => [{ code: 'yyy' }], { force: true });

    expect(shape.try('aaa', { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  test('shape provider is called only once', () => {
    const providedShape = new NumberShape();
    const shapeProviderMock = jest.fn(() => providedShape);

    const shape1: LazyShape<any, any> = new LazyShape(shapeProviderMock, identity);
    const shape2 = shape1.check(() => null);

    expect(shape1.providedShape).toBe(providedShape);
    expect(shape2.providedShape).toBe(providedShape);
    expect(shapeProviderMock).toHaveBeenCalledTimes(1);
  });

  describe('_isAsync', () => {
    test('prevents short circuit', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => shape, identity);

      expect(shape['_isAsync']()).toBe(false);
    });

    test('prevents infinite loop', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => new ObjectShape({ key1: shape }, null), identity);

      expect(shape['_isAsync']()).toBe(false);
    });

    test('returns true if async', () => {
      const shape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: shape.convertAsync(() => Promise.resolve(111)) }, null),
        identity
      );

      expect(shape['_isAsync']()).toBe(true);
    });
  });

  describe('inputs', () => {
    test('prevents short circuit', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => shape, identity);

      expect(shape.inputs).toEqual([]);
    });

    test('prevents infinite loop', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => new ObjectShape({ key1: shape }, null), identity);

      expect(shape.inputs).toEqual([TYPE_OBJECT]);
    });
  });

  describe('providedShape', () => {
    test('prevents short circuit', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => shape, identity);

      expect(shape.providedShape).toBe(shape);
    });

    test('throws an exception on premature access', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => shape.providedShape, identity);

      expect(() => shape.providedShape).toThrow(new Error(ERROR_SHAPE_EXPECTED));
    });

    test('throws an exception if shape is accessed from the provider', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => shape.check(() => null).providedShape, identity);

      expect(() => shape.providedShape).toThrow(new Error(ERROR_SHAPE_EXPECTED));
    });
  });

  describe('deepPartial', () => {
    test('makes provided shape deep partial', () => {
      const providedShape = new MockShape();

      class DeepPartialAwareMockShape extends MockShape implements DeepPartialProtocol<Shape> {
        deepPartial() {
          return providedShape;
        }
      }

      const shapeProviderMock = jest.fn(() => new DeepPartialAwareMockShape());

      const shape = new LazyShape(shapeProviderMock, identity).deepPartial();

      expect(shapeProviderMock).not.toHaveBeenCalled();

      expect(shape.providedShape).toBe(providedShape);
      expect(shapeProviderMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('cyclic objects', () => {
    test('raises issues', () => {
      const shape: LazyShape<any, any> = new LazyShape(
        () => shape,
        () => {
          throw new ValidationError([{ code: 'xxx' }]);
        }
      );

      expect(shape.try(111)).toEqual({ ok: false, issues: [{ code: 'xxx' }] });
    });

    test('parses immediately recursive lazy shape', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => shape, identity);

      expect(shape.parse(111)).toBe(111);
      expect(shape['_stackMap'].size).toBe(0);
    });

    test('parses cyclic shapes', () => {
      const shape: LazyShape<any, any> = new LazyShape(() => new ObjectShape({ key1: shape }, null), identity);

      const input: any = {};
      input.key1 = input;

      expect(shape.parse(input)).toBe(input);
      expect(shape['_stackMap'].size).toBe(0);
    });

    test('shows issues only for the first input value', () => {
      const shape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: new ObjectShape({ key2: shape }, null), key3: new StringShape() }, null),
        identity
      );

      const input: any = {};
      input.key1 = {};
      input.key1.key2 = input;

      expect(shape.try(input, { earlyReturn: true })).toEqual({
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
      const shape: LazyShape<any, any> = new LazyShape(
        () =>
          new ObjectShape(
            {
              key1: shape.check(() => {
                throw new Error('expected');
              }),
            },
            null
          ),
        identity
      );

      const input: any = {};
      input.key1 = input;

      expect(() => shape.parse(input)).toThrow('expected');
      expect(shape['_stackMap'].size).toBe(0);
      expect(shape.providedShape.propShapes.key1['_stackMap'].size).toBe(0);
    });

    test('nested parse invocations are separated by nonce', () => {
      const cbMock = jest.fn();

      const shape: LazyShape<any, any> = new LazyShape(
        () =>
          shape
            .convert(value => {
              return value !== 111 ? shape.parse(111) : value;
            })
            .check(cbMock),
        identity
      );

      shape.parse(222);

      expect(nextNonce()).toBe(2);
      expect(cbMock).toHaveBeenCalledTimes(2);
      expect(cbMock).toHaveBeenNthCalledWith(1, 111, undefined, { earlyReturn: false, coerce: false });
      expect(cbMock).toHaveBeenNthCalledWith(2, 111, undefined, { earlyReturn: false, coerce: false });
    });
  });

  describe('async', () => {
    test('parses values with an underlying shape', async () => {
      const providedShape = new AsyncMockShape();

      const shape = new LazyShape(() => providedShape, identity);

      expect(shape.isAsync).toBe(true);
      await expect(shape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(providedShape._applyAsync).toHaveBeenCalledTimes(1);
      expect(providedShape._applyAsync).toHaveBeenNthCalledWith(1, 'aaa', { earlyReturn: false, coerce: false }, 0);
    });

    test('clears stack if an error is thrown', async () => {
      const shape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: shape, key2: new AsyncMockShape() }, null),
        identity
      ).check(() => {
        throw new Error('expected');
      });

      const input: any = {};
      input.key1 = input;

      await expect(shape.parseAsync(input)).rejects.toEqual(new Error('expected'));

      expect(shape['_stackMap'].size).toBe(0);
      expect(shape.providedShape.propShapes.key1['_stackMap'].size).toBe(0);
    });

    test('parallel parse calls of cyclic shapes are separated by nonce', async () => {
      const shape: LazyShape<any, any> = new LazyShape(
        () => new ObjectShape({ key1: shape, key2: new AsyncMockShape() }, null),
        identity
      );

      const shapeSpy = spyOnShape(shape);

      const input1: any = { key2: 'aaa' };
      input1.key1 = input1;

      const input2: any = { key2: 'bbb' };
      input2.key1 = input2;

      await Promise.all([shape.parseAsync(input1), shape.parseAsync(input2)]);

      expect(shapeSpy._applyAsync).toHaveBeenCalledTimes(4);
      expect(shapeSpy._applyAsync).toHaveBeenNthCalledWith(1, input1, { earlyReturn: false, coerce: false }, 0);
      expect(shapeSpy._applyAsync).toHaveBeenNthCalledWith(2, input2, { earlyReturn: false, coerce: false }, 1);
      expect(shapeSpy._applyAsync).toHaveBeenNthCalledWith(3, input1, { earlyReturn: false, coerce: false }, 0);
      expect(shapeSpy._applyAsync).toHaveBeenNthCalledWith(4, input2, { earlyReturn: false, coerce: false }, 1);
    });
  });
});
