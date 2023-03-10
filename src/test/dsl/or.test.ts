import * as d from '../../main';
import { UNKNOWN } from '../../main/utils/type-system';

describe('or', () => {
  test('returns a union shape', () => {
    expect(d.or([d.number()])).toBeInstanceOf(d.UnionShape);
  });

  test('unknown absorbs other types in a union', () => {
    expect(d.or([d.string(), d.any()]).inputTypes).toEqual([UNKNOWN]);
  });
});
