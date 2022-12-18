import { ArrayShape, BooleanShape, NumberShape, ObjectShape, Shape, StringShape, UnionShape } from '../../main';
import { CODE_UNION, MESSAGE_UNION } from '../../main/constants';

describe('UnionShape', () => {
  test('distributes buckets', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
    const applySpy3 = jest.spyOn<Shape, any>(shape3, '_apply');

    const orShape = new UnionShape([shape1, shape2, shape3]);

    expect(orShape['_getInputTypes']()).toEqual(['number', 'string', 'boolean']);
    expect(orShape.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
  });

  test('unwraps union shapes into buckets', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();
    const orShape1 = new UnionShape([shape2, shape3]);

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
    const applySpy3 = jest.spyOn<Shape, any>(shape3, '_apply');
    const unionApplySpy = jest.spyOn<Shape, any>(shape3, '_apply');

    const orShape2 = new UnionShape([shape1, orShape1]);

    expect(orShape2['_getInputTypes']()).toEqual(['number', 'string', 'boolean']);
    expect(orShape2.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
    expect(unionApplySpy).not.toHaveBeenCalled();
  });

  test('does not unwrap union shapes that have checks', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();
    const orShape1 = new UnionShape([shape2, shape3]).refine(() => true);

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
    const applySpy3 = jest.spyOn<Shape, any>(shape3, '_apply');
    const unionApplySpy = jest.spyOn<Shape, any>(orShape1, '_apply');

    const orShape2 = new UnionShape([shape1, orShape1]);

    expect(orShape2.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
    expect(unionApplySpy).toHaveBeenCalledTimes(1);
  });

  test('returns the result of the first shape that returned ok', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape();
    const shape3 = new Shape();

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
    const applySpy3 = jest.spyOn<Shape, any>(shape3, '_apply');

    const orShape = new UnionShape([shape1, shape2, shape3]);

    expect(orShape.parse('aaa')).toBe('aaa');
    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
  });

  test('raises if no shapes returned ok', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

    const orShape = new UnionShape([shape1, shape2]);

    expect(orShape.try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_UNION,
          path: [],
          input: 'aaa',
          message: MESSAGE_UNION,
          param: [
            { code: 'xxx', path: [] },
            { code: 'yyy', path: [] },
          ],
        },
      ],
    });
  });

  test('applies checks', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const orShape = new UnionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

    expect(orShape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('returns union of child shapes at key', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();
    const shape3 = new Shape();
    const objShape = new ObjectShape({ 1: shape1, key1: shape2 }, null);
    const arrShape = new ArrayShape(null, shape3);

    const orShape = new UnionShape([objShape, arrShape]);

    const shape: any = orShape.at(1);

    expect(shape instanceof UnionShape).toBe(true);
    expect(shape.shapes.length).toBe(2);
    expect(shape.shapes[0]).toBe(shape1);
    expect(shape.shapes[1]).toBe(shape3);
  });

  test('returns non-null child shapes at key', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();
    const shape3 = new Shape();
    const objShape = new ObjectShape({ 1: shape1, key1: shape2 }, null);
    const arrShape = new ArrayShape(null, shape3);

    const orShape = new UnionShape([objShape, arrShape]);

    expect(orShape.at('key1')).toBe(shape2);
  });

  describe('async', () => {
    test('distributes buckets', async () => {
      const shape1 = new NumberShape();
      const shape2 = new StringShape().transformAsync(value => Promise.resolve(value));
      const shape3 = new BooleanShape();

      const applyAsyncSpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applyAsyncSpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applyAsyncSpy3 = jest.spyOn<Shape, any>(shape3, '_applyAsync');

      const orShape = new UnionShape([shape1, shape2, shape3]);

      expect(orShape.async).toBe(true);

      await expect(orShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applyAsyncSpy1).not.toHaveBeenCalled();
      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy3).not.toHaveBeenCalled();
    });

    test('unwraps union shapes into buckets', async () => {
      const shape1 = new NumberShape();
      const shape2 = new StringShape().transformAsync(value => Promise.resolve(value));
      const shape3 = new BooleanShape();
      const orShape1 = new UnionShape([shape2, shape3]);

      const applyAsyncSpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applyAsyncSpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applyAsyncSpy3 = jest.spyOn<Shape, any>(shape3, '_applyAsync');
      const unionApplyAsyncSpy = jest.spyOn<Shape, any>(shape3, '_applyAsync');

      const orShape2 = new UnionShape([shape1, orShape1]);

      expect(orShape2.async).toBe(true);

      await expect(orShape2.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applyAsyncSpy1).not.toHaveBeenCalled();
      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy3).not.toHaveBeenCalled();
      expect(unionApplyAsyncSpy).not.toHaveBeenCalled();
    });

    test('does not unwrap union shapes that have checks', async () => {
      const shape1 = new NumberShape();
      const shape2 = new StringShape().transformAsync(value => Promise.resolve(value));
      const shape3 = new BooleanShape();
      const orShape1 = new UnionShape([shape2, shape3]).refine(() => true);

      const applyAsyncSpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applyAsyncSpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applyAsyncSpy3 = jest.spyOn<Shape, any>(shape3, '_applyAsync');
      const unionApplyAsyncSpy = jest.spyOn<Shape, any>(orShape1, '_applyAsync');

      const orShape2 = new UnionShape([shape1, orShape1]);

      expect(orShape2.async).toBe(true);

      await expect(orShape2.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applyAsyncSpy1).not.toHaveBeenCalled();
      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy3).not.toHaveBeenCalled();
      expect(unionApplyAsyncSpy).toHaveBeenCalledTimes(1);
    });

    test('returns the result of the first shape that returned ok', async () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new Shape().transformAsync(value => Promise.resolve(value));
      const shape3 = new Shape();

      shape1.async;
      shape2.async;
      shape3.async;

      const applyAsyncSpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applyAsyncSpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applyAsyncSpy3 = jest.spyOn<Shape, any>(shape3, '_applyAsync');

      const orShape = new UnionShape([shape1, shape2, shape3]);

      await expect(orShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applyAsyncSpy1).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy2).toHaveBeenCalledTimes(1);
      expect(applyAsyncSpy3).not.toHaveBeenCalled();
    });

    test('raises if no shapes returned ok', async () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'yyy' }]);

      const orShape = new UnionShape([shape1, shape2]);

      await expect(orShape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNION,
            path: [],
            input: 'aaa',
            message: MESSAGE_UNION,
            param: [
              { code: 'xxx', path: [] },
              { code: 'yyy', path: [] },
            ],
          },
        ],
      });
    });

    test('applies checks', async () => {
      const shape1 = new Shape();
      const shape2 = new Shape().transformAsync(value => Promise.resolve(value));

      const orShape = new UnionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

      await expect(orShape.tryAsync({})).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });
});
