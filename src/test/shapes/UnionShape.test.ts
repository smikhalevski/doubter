import {
  AnyShape,
  ApplyOptions,
  ArrayShape,
  BooleanShape,
  ConstShape,
  EnumShape,
  IntersectionShape,
  NeverShape,
  NumberShape,
  ObjectShape,
  Result,
  Shape,
  StringShape,
  UnionShape,
} from '../../main';
import { CODE_UNION, MESSAGE_UNION } from '../../main/constants';
import { createLookupByDiscriminator, createLookupByType, getDiscriminator } from '../../main/shapes/UnionShape';
import { BOOLEAN, NUMBER, STRING, UNKNOWN } from '../../main/utils';

describe('UnionShape', () => {
  class AsyncShape extends Shape {
    protected _isAsync(): boolean {
      return true;
    }

    protected _applyAsync(input: unknown, options: ApplyOptions) {
      return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
    }
  }

  let asyncShape: AsyncShape;

  beforeEach(() => {
    asyncShape = new AsyncShape();
  });

  test('distributes buckets by input types', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();

    const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
    const applySpy2 = jest.spyOn<Shape, any>(shape2, '_apply');
    const applySpy3 = jest.spyOn<Shape, any>(shape3, '_apply');

    const orShape = new UnionShape([shape1, shape2, shape3]);

    expect(orShape.inputTypes).toEqual([NUMBER, STRING, BOOLEAN]);
    expect(orShape.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
  });

  test('parses nested unions', () => {
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

  test('parses a discriminated union', () => {
    const shape = new UnionShape([
      new ObjectShape({ type: new ConstShape('aaa') }, null),
      new ObjectShape({ type: new ConstShape('bbb') }, null),
    ]);

    expect(shape.parse({ type: 'bbb' })).toEqual({ type: 'bbb' });
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

  test('raises union issue if no shapes returned ok', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

    const orShape = new UnionShape([shape1, shape2]);

    expect(orShape.try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_UNION,
          input: 'aaa',
          message: MESSAGE_UNION,
          param: {
            inputTypes: [UNKNOWN],
            issueGroups: [[{ code: 'xxx' }], [{ code: 'yyy' }]],
          },
        },
      ],
    });
  });

  test('raises issues of a single object shape from a discriminated union', () => {
    const shape1 = new ObjectShape({ type: new ConstShape('aaa') }, null).check(() => [{ code: 'xxx' }]);
    const shape2 = new ObjectShape({ type: new ConstShape('bbb') }, null).check(() => [{ code: 'yyy' }]);

    const orShape = new UnionShape([shape1, shape2]);

    expect(orShape.try({ type: 'bbb' })).toEqual({
      ok: false,
      issues: [{ code: 'yyy' }],
    });
  });

  test('applies checks', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const orShape = new UnionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

    expect(orShape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputTypes', () => {
    test('never is erased', () => {
      expect(new UnionShape([new StringShape(), new NeverShape()]).inputTypes).toEqual([STRING]);
    });

    test('any absorbs other types', () => {
      expect(new UnionShape([new StringShape(), new Shape()]).inputTypes).toEqual([UNKNOWN]);
      expect(new UnionShape([new NeverShape(), new Shape()]).inputTypes).toEqual([UNKNOWN]);
    });

    test('null if shapes have continuous values', () => {
      expect(new UnionShape([new StringShape(), new NumberShape()]).inputTypes).toEqual([STRING, NUMBER]);
    });

    test('the array of unique values', () => {
      const shape = new UnionShape([new EnumShape(['aaa', 'bbb']), new EnumShape(['aaa', 'ccc'])]);

      expect(shape.inputTypes).toEqual(['bbb', 'aaa', 'ccc']);
    });

    test('never is ignored', () => {
      const shape = new UnionShape([new EnumShape(['aaa', 'bbb']), new NeverShape()]);

      expect(shape.inputTypes).toEqual(['aaa', 'bbb']);
    });

    test('an empty array if union only contains never', () => {
      const shape = new UnionShape([new NeverShape()]);

      expect(shape.inputTypes).toEqual([]);
    });
  });

  describe('at', () => {
    test('returns a union of child shapes at key', () => {
      const shape1 = new Shape();
      const shape2 = new Shape();
      const shape3 = new Shape();
      const objShape = new ObjectShape({ 1: shape1, key1: shape2 }, null);
      const arrShape = new ArrayShape(null, shape3);

      const orShape = new UnionShape([objShape, arrShape]);

      const shape = orShape.at(1) as UnionShape<AnyShape[]>;

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
  });

  describe('deepPartial', () => {
    test('parses united deep partial objects', () => {
      const orShape = new UnionShape([
        new ObjectShape({ key1: new StringShape() }, null),
        new ObjectShape({ key2: new StringShape() }, null),
      ]).deepPartial();

      expect(orShape.parse({})).toEqual({});
      expect(orShape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(orShape.parse({ key2: 'aaa' })).toEqual({ key2: 'aaa' });
      expect(orShape.parse({ key1: 'aaa', key2: undefined })).toEqual({ key1: 'aaa', key2: undefined });
    });

    test('does not make shapes optional', () => {
      const orShape = new UnionShape([new NumberShape()]).deepPartial();

      expect(orShape.parse(111)).toBe(111);
      expect(orShape.try(undefined)).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNION,
            message: MESSAGE_UNION,
            param: {
              inputTypes: [NUMBER],
              issueGroups: null,
            },
          },
        ],
      });
    });
  });

  describe('async', () => {
    test('distributes buckets by input types', async () => {
      const shape1 = new NumberShape();
      const shape2 = new StringShape().transformAsync(value => Promise.resolve(value));
      const shape3 = new BooleanShape();

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applySpy3 = jest.spyOn<Shape, any>(shape3, '_applyAsync');

      const orShape = new UnionShape([shape1, shape2, shape3]);

      expect(orShape.isAsync).toBe(true);

      await expect(orShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applySpy1).not.toHaveBeenCalled();
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy3).not.toHaveBeenCalled();
    });

    test('parses nested unions', async () => {
      const shape1 = new NumberShape();
      const shape2 = new StringShape().transformAsync(value => Promise.resolve(value));
      const shape3 = new BooleanShape();
      const orShape1 = new UnionShape([shape2, shape3]).refine(() => true);

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_applyAsync');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applySpy3 = jest.spyOn<Shape, any>(shape3, '_applyAsync');
      const unionApplySpy = jest.spyOn<Shape, any>(orShape1, '_applyAsync');

      const orShape2 = new UnionShape([shape1, orShape1]);

      expect(orShape2.isAsync).toBe(true);

      await expect(orShape2.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applySpy1).not.toHaveBeenCalled();
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy3).not.toHaveBeenCalled();
      expect(unionApplySpy).toHaveBeenCalledTimes(1);
    });

    test('returns the result of the first shape that returned ok', async () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = asyncShape;
      const shape3 = new Shape();

      shape1.isAsync;
      shape2.isAsync;
      shape3.isAsync;

      const applySpy1 = jest.spyOn<Shape, any>(shape1, '_apply');
      const applySpy2 = jest.spyOn<Shape, any>(shape2, '_applyAsync');
      const applySpy3 = jest.spyOn<Shape, any>(shape3, '_apply');

      const orShape = new UnionShape([shape1, shape2, shape3]);

      await expect(orShape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(applySpy1).toHaveBeenCalledTimes(1);
      expect(applySpy2).toHaveBeenCalledTimes(1);
      expect(applySpy3).not.toHaveBeenCalled();
    });

    test('raises union issue if no shapes returned ok', async () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = asyncShape.check(() => [{ code: 'yyy' }]);

      const orShape = new UnionShape([shape1, shape2]);

      await expect(orShape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [
          {
            code: CODE_UNION,
            input: 'aaa',
            message: MESSAGE_UNION,
            param: {
              inputTypes: [UNKNOWN],
              issueGroups: [[{ code: 'xxx' }], [{ code: 'yyy' }]],
            },
          },
        ],
      });
    });

    test('raises issues of a single object shape from a discriminated union', async () => {
      const shape1 = new ObjectShape({ type: new ConstShape('aaa') }, null).check(() => [{ code: 'xxx' }]);
      const shape2 = new ObjectShape(
        {
          type: new ConstShape('bbb'),
          key1: asyncShape.check(() => [{ code: 'zzz' }]),
        },
        null
      ).check({ unsafe: true }, () => [{ code: 'yyy' }]);

      const orShape = new UnionShape([shape1, shape2]);

      await expect(orShape.tryAsync({ type: 'bbb' }, { verbose: true })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'zzz', path: ['key1'] }, { code: 'yyy' }],
      });
    });

    test('applies checks', async () => {
      const orShape = new UnionShape([new Shape(), asyncShape]).check(() => [{ code: 'xxx' }]);

      await expect(orShape.tryAsync({})).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });
});

describe('getDiscriminator', () => {
  test('returns the discriminator key and corresponding values for each shape in the union', () => {
    expect(
      getDiscriminator([
        new ObjectShape({ type: new ConstShape('aaa') }, null),
        new ObjectShape({ type: new ConstShape('bbb') }, null),
      ])
    ).toEqual({
      key: 'type',
      valueGroups: [['aaa'], ['bbb']],
    });
  });

  test('returns the discriminator key if there are multiple keys', () => {
    expect(
      getDiscriminator([
        new ObjectShape(
          {
            type1: new ConstShape('aaa'),
            type2: new ConstShape('bbb'),
          },
          null
        ),
        new ObjectShape(
          {
            type1: new ConstShape('aaa'),
            type2: new ConstShape('ccc'),
          },
          null
        ),
      ])
    ).toEqual({
      key: 'type2',
      valueGroups: [['bbb'], ['ccc']],
    });
  });

  test('returns the discriminator for enum values', () => {
    expect(
      getDiscriminator([
        new ObjectShape({ type: new EnumShape(['aaa', 'bbb']) }, null),
        new ObjectShape({ type: new ConstShape('ccc') }, null),
      ])
    ).toEqual({
      key: 'type',
      valueGroups: [['aaa', 'bbb'], ['ccc']],
    });
  });

  test('returns null if there is no property with distinct discrete properties', () => {
    expect(
      getDiscriminator([
        new ObjectShape({ type: new EnumShape(['aaa', 'bbb']) }, null),
        new ObjectShape({ type: new ConstShape('bbb') }, null),
      ])
    ).toBeNull();

    expect(
      getDiscriminator([
        new ObjectShape({ type: new NumberShape() }, null),
        new ObjectShape({ type: new ConstShape(111) }, null),
      ])
    ).toBeNull();

    expect(
      getDiscriminator([
        new ObjectShape({ type: new NeverShape() }, null),
        new ObjectShape({ type: new ConstShape(111) }, null),
      ])
    ).toBeNull();
  });

  test('returns null if there are not enough shapes', () => {
    expect(getDiscriminator([])).toBeNull();
    expect(getDiscriminator([new ObjectShape({ type: new ConstShape('aaa') }, null)])).toBeNull();
  });

  test('works with composite shapes', () => {
    expect(
      getDiscriminator([
        new ObjectShape(
          {
            type: new UnionShape([
              new IntersectionShape([new EnumShape(['aaa', 'bbb']), new ConstShape(['bbb', 'ccc'])]),
              new EnumShape(['bbb', 'ddd']),
            ]),
          },
          null
        ),
        new ObjectShape({ type: new ConstShape('aaa') }, null),
      ])
    ).toEqual({
      key: 'type',
      valueGroups: [['bbb', 'ddd'], ['aaa']],
    });
  });
});

describe('createLookupByDiscriminator', () => {
  test('returns null if not all shapes are objects', () => {
    expect(
      createLookupByDiscriminator([new ObjectShape({ key1: new ConstShape('aaa') }, null), new NumberShape()])
    ).toBeNull();
  });

  test('returns null if only one shape in the union', () => {
    expect(createLookupByDiscriminator([new ObjectShape({ key1: new ConstShape('aaa') }, null)])).toBeNull();
  });

  test('returns lookup for enum values', () => {
    const shape1 = new ObjectShape({ type: new EnumShape(['aaa', 'bbb']) }, null);
    const shape2 = new ObjectShape({ type: new EnumShape([111, 222]) }, null);

    const lookup = createLookupByDiscriminator([shape1, shape2])!;

    expect(lookup({ type: 'xxx' }).length).toBe(0);
    expect(lookup({ type: 'aaa' })[0]).toBe(shape1);
    expect(lookup({ type: 'bbb' })[0]).toBe(shape1);
    expect(lookup({ type: 111 })[0]).toBe(shape2);
    expect(lookup({ type: 222 })[0]).toBe(shape2);
  });

  test('returns lookup for const values', () => {
    const shape1 = new ObjectShape({ type: new ConstShape('aaa') }, null);
    const shape2 = new ObjectShape({ type: new ConstShape(111) }, null);

    const lookup = createLookupByDiscriminator([shape1, shape2])!;

    expect(lookup({ type: 'xxx' }).length).toBe(0);
    expect(lookup({ type: 'aaa' })[0]).toBe(shape1);
    expect(lookup({ type: 111 })[0]).toBe(shape2);
  });
});

describe('createLookupByType', () => {
  test('returns type-based lookup', () => {
    const shape1 = new StringShape();
    const shape2 = new NumberShape();

    const lookup = createLookupByType([shape1, shape2]);

    expect(lookup(true).length).toBe(0);
    expect(lookup('aaa')[0]).toBe(shape1);
    expect(lookup(111)[0]).toBe(shape2);
  });

  test('shapes with any input type are matched with any input', () => {
    const shape1 = new Shape();
    const shape2 = new NumberShape();

    const lookup = createLookupByType([shape1, shape2]);

    expect(lookup(true).length).toBe(1);
    expect(lookup(true)[0]).toBe(shape1);

    expect(lookup(111).length).toBe(2);
    expect(lookup(111)[0]).toBe(shape1);
    expect(lookup(111)[1]).toBe(shape2);
  });

  test('never shapes are ignored', () => {
    const lookup = createLookupByType([new NeverShape()]);

    expect(lookup(111).length).toBe(0);
  });
});
