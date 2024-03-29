import * as d from '../../main';
import { Type } from '../../main/Type';

describe('or', () => {
  test('returns a union shape', () => {
    expect(d.or([d.number()])).toBeInstanceOf(d.UnionShape);
  });

  test('unknown absorbs other types in a union', () => {
    expect(d.or([d.string(), d.any()]).inputs).toEqual([Type.UNKNOWN]);
  });
});
