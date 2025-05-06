import { describe, expect, test } from 'vitest';
import * as d from '../../main';
import { Type } from '../../main/Type';

describe('never', () => {
  test('returns a never shape', () => {
    expect(d.never()).toBeInstanceOf(d.NeverShape);
  });

  test('never is erased in unions', () => {
    expect(d.or([d.string(), d.never()]).inputs).toEqual([Type.STRING]);
  });

  test('never absorbs other types in intersections', () => {
    expect(d.and([d.string(), d.never()]).inputs).toEqual([]);
  });
});
