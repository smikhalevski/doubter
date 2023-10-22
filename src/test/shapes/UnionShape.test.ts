import {
  AnyShape,
  ArrayShape,
  BooleanShape,
  ConstShape,
  EnumShape,
  IntersectionShape,
  NeverShape,
  NumberShape,
  ObjectShape,
  Shape,
  StringShape,
  UnionShape,
} from '../../main';
import { CODE_TYPE_UNION } from '../../main/constants';
import { createLookupByDiscriminator, createLookupByType, getDiscriminator } from '../../main/shape/UnionShape';
import { TYPE_BOOLEAN, TYPE_NUMBER, TYPE_STRING, TYPE_UNKNOWN } from '../../main/Type';
import { AsyncMockShape, MockShape, spyOnShape } from './mocks';

describe('UnionShape', () => {
  test('distributes buckets by inputs', () => {
    const shape1 = spyOnShape(new NumberShape());
    const shape2 = spyOnShape(new StringShape());
    const shape3 = spyOnShape(new BooleanShape());

    const shape = new UnionShape([shape1, shape2, shape3]);

    expect(shape.inputs).toEqual([TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN]);
    expect(shape.parse('aaa')).toBe('aaa');
    expect(shape1._apply).not.toHaveBeenCalled();
    expect(shape2._apply).toHaveBeenCalledTimes(1);
    expect(shape3._apply).not.toHaveBeenCalled();
  });

  test('parses nested unions', () => {
    const shape1 = spyOnShape(new NumberShape());
    const shape2 = spyOnShape(new StringShape());
    const shape3 = spyOnShape(new BooleanShape());

    const unionShape1 = spyOnShape(new UnionShape([shape2, shape3]).check(() => null));
    const unionShape2 = spyOnShape(new UnionShape([shape1, unionShape1]));

    expect(unionShape2.parse('aaa')).toBe('aaa');
    expect(shape1._apply).not.toHaveBeenCalled();
    expect(shape2._apply).toHaveBeenCalledTimes(1);
    expect(shape3._apply).not.toHaveBeenCalled();
    expect(unionShape1._apply).toHaveBeenCalledTimes(1);
  });

  test('parses a discriminated union', () => {
    const shape = new UnionShape([
      new ObjectShape({ type: new ConstShape('aaa') }, null),
      new ObjectShape({ type: new ConstShape('bbb') }, null),
    ]);

    expect(shape.parse({ type: 'bbb' })).toEqual({ type: 'bbb' });
  });

  test('returns the result of the first shape that returned ok', () => {
    const shape1 = new MockShape().check(() => [{ code: 'xxx' }]);
    const shape2 = new MockShape();
    const shape3 = new MockShape();

    const shape = new UnionShape([shape1, shape2, shape3]);

    expect(shape.parse('aaa')).toBe('aaa');
    expect(shape1._apply).toHaveBeenCalledTimes(1);
    expect(shape2._apply).toHaveBeenCalledTimes(1);
    expect(shape3._apply).not.toHaveBeenCalled();
  });

  test('raises union issue if no shapes returned ok', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

    const shape = new UnionShape([shape1, shape2]);

    expect(shape.try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_UNION,
          input: 'aaa',
          message: Shape.messages[CODE_TYPE_UNION],
          param: {
            inputs: [TYPE_UNKNOWN],
            issueGroups: [[{ code: 'xxx' }], [{ code: 'yyy' }]],
          },
        },
      ],
    });
  });

  test('raises issues of a single object shape from a discriminated union', () => {
    const shape1 = new ObjectShape({ type: new ConstShape('aaa') }, null).check(() => [{ code: 'xxx' }]);
    const shape2 = new ObjectShape({ type: new ConstShape('bbb') }, null).check(() => [{ code: 'yyy' }]);

    const shape = new UnionShape([shape1, shape2]);

    expect(shape.try({ type: 'bbb' })).toEqual({
      ok: false,
      issues: [{ code: 'yyy' }],
    });
  });

  test('applies operations', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const shape = new UnionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

    expect(shape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('inputs', () => {
    test('never is erased', () => {
      expect(new UnionShape([new StringShape(), new NeverShape()]).inputs).toEqual([TYPE_STRING]);
    });

    test('unknown absorbs other types', () => {
      expect(new UnionShape([new StringShape(), new Shape()]).inputs).toEqual([TYPE_UNKNOWN]);
      expect(new UnionShape([new NeverShape(), new Shape()]).inputs).toEqual([TYPE_UNKNOWN]);
    });

    test('the array of unique values', () => {
      const shape = new UnionShape([new EnumShape(['aaa', 'bbb']), new EnumShape(['aaa', 'ccc'])]);

      expect(shape.inputs).toEqual(['bbb', 'aaa', 'ccc']);
    });

    test('an empty array if union only contains never', () => {
      const shape = new UnionShape([new NeverShape()]);

      expect(shape.inputs).toEqual([]);
    });
  });

  describe('at', () => {
    test('returns a union of child shapes at key', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();
      const restShape = new Shape();

      const shape1 = new ObjectShape({ 1: valueShape1, key1: valueShape2 }, null);
      const shape2 = new ArrayShape([], restShape);

      const unionShape1 = new UnionShape([shape1, shape2]);
      const unionShape2 = unionShape1.at(1) as UnionShape<AnyShape[]>;

      expect(unionShape2 instanceof UnionShape).toBe(true);
      expect(unionShape2.shapes.length).toBe(2);
      expect(unionShape2.shapes[0]).toBe(valueShape1);
      expect(unionShape2.shapes[1]).toBe(restShape);
    });

    test('returns non-null child shapes at key', () => {
      const valueShape1 = new Shape();
      const valueShape2 = new Shape();
      const restShape = new Shape();

      const shape1 = new ObjectShape({ 1: valueShape1, key1: valueShape2 }, null);
      const shape2 = new ArrayShape([], restShape);

      const shape = new UnionShape([shape1, shape2]);

      expect(shape.at('key1')).toBe(valueShape2);
    });
  });

  describe('deepPartial', () => {
    test('parses united deep partial objects', () => {
      const shape = new UnionShape([
        new ObjectShape({ key1: new StringShape() }, null),
        new ObjectShape({ key2: new StringShape() }, null),
      ]).deepPartial();

      expect(shape.parse({})).toEqual({});
      expect(shape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(shape.parse({ key2: 'aaa' })).toEqual({ key2: 'aaa' });
      expect(shape.parse({ key1: 'aaa', key2: undefined })).toEqual({ key1: 'aaa', key2: undefined });
    });

    test('does not make shapes optional', () => {
      const shape = new UnionShape([new NumberShape()]).deepPartial();

      expect(shape.parse(111)).toBe(111);
      expect(shape.try(undefined)).toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE_UNION,
            message: Shape.messages[CODE_TYPE_UNION],
            param: {
              inputs: [TYPE_NUMBER],
              issueGroups: null,
            },
          },
        ],
      });
    });
  });

  describe('async', () => {
    test('distributes buckets by inputs', async () => {
      const shape1 = spyOnShape(new NumberShape());
      const shape2 = spyOnShape(new StringShape().convertAsync(value => Promise.resolve(value)));
      const shape3 = spyOnShape(new BooleanShape());

      const shape = new UnionShape([shape1, shape2, shape3]);

      expect(shape.isAsync).toBe(true);

      await expect(shape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(shape1._applyAsync).not.toHaveBeenCalled();
      expect(shape2._applyAsync).toHaveBeenCalledTimes(1);
      expect(shape3._applyAsync).not.toHaveBeenCalled();
    });

    test('parses nested unions', async () => {
      const shape1 = spyOnShape(new NumberShape());
      const shape2 = spyOnShape(new StringShape().convertAsync(value => Promise.resolve(value)));
      const shape3 = spyOnShape(new BooleanShape());

      const unionShape1 = spyOnShape(new UnionShape([shape2, shape3]).check(() => null));
      const unionShape2 = new UnionShape([shape1, unionShape1]);

      expect(unionShape2.isAsync).toBe(true);

      await expect(unionShape2.parseAsync('aaa')).resolves.toBe('aaa');
      expect(shape1._applyAsync).not.toHaveBeenCalled();
      expect(shape2._applyAsync).toHaveBeenCalledTimes(1);
      expect(shape3._applyAsync).not.toHaveBeenCalled();
      expect(unionShape1._applyAsync).toHaveBeenCalledTimes(1);
    });

    test('returns the result of the first shape that returned ok', async () => {
      const shape1 = new MockShape().check(() => [{ code: 'xxx' }]);
      const shape2 = new AsyncMockShape();
      const shape3 = new MockShape();

      const shape = new UnionShape([shape1, shape2, shape3]);

      await expect(shape.parseAsync('aaa')).resolves.toBe('aaa');
      expect(shape1._apply).toHaveBeenCalledTimes(1);
      expect(shape2._applyAsync).toHaveBeenCalledTimes(1);
      expect(shape3._apply).not.toHaveBeenCalled();
    });

    test('raises union issue if no shapes returned ok', async () => {
      const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
      const shape2 = new AsyncMockShape().check(() => [{ code: 'yyy' }]);

      const shape = new UnionShape([shape1, shape2]);

      await expect(shape.tryAsync('aaa')).resolves.toEqual({
        ok: false,
        issues: [
          {
            code: CODE_TYPE_UNION,
            input: 'aaa',
            message: Shape.messages[CODE_TYPE_UNION],
            param: {
              inputs: [TYPE_UNKNOWN],
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
          key1: new AsyncMockShape().check(() => [{ code: 'zzz' }]),
        },
        null
      ).check(() => [{ code: 'yyy' }], { force: true });

      const shape = new UnionShape([shape1, shape2]);

      await expect(shape.tryAsync({ type: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'zzz', path: ['key1'] }, { code: 'yyy' }],
      });
    });

    test('applies operations', async () => {
      const shape = new UnionShape([new Shape(), new AsyncMockShape()]).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync({})).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow errors', async () => {
      const shape = new UnionShape([
        new AsyncMockShape().refine(() => false),
        new AsyncMockShape().check(() => {
          throw new Error('expected');
        }),
      ]);

      await expect(shape.tryAsync(111)).rejects.toEqual(new Error('expected'));
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

  test('shapes with unknown inputs are matched with any input', () => {
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
