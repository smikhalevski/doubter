import { describe, expect, test } from 'vitest';
import * as d from '../../main';
import { Type } from '../../main/Type';

describe('union', () => {
  test('returns a union shape', () => {
    const shape = d.union([d.string(), d.number()]);

    expect(shape).toBeInstanceOf(d.UnionShape);
    expect(shape.inputs).toEqual([Type.STRING, Type.NUMBER]);

    expect(d.or([d.string()])).toBeInstanceOf(d.UnionShape);
  });
});
