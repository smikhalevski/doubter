import { describe, expect, test } from 'vitest';
import * as d from '../../main';
import { Type } from '../../main/Type';

describe('any', () => {
  test('returns a shape', () => {
    expect(d.any()).toBeInstanceOf(d.Shape);
  });

  test('unknown is erased in an intersection', () => {
    expect(d.and([d.string(), d.any()]).inputs).toEqual([Type.STRING]);
    expect(d.and([d.never(), d.any()]).inputs).toEqual([]);
  });

  test('returns a shape with a refinement', () => {
    const cb = () => true;

    expect(d.any(cb).operations[0]).toEqual({
      type: cb,
      param: undefined,
      isAsync: false,
      tolerance: 'auto',
      callback: expect.any(Function),
    });
  });
});
