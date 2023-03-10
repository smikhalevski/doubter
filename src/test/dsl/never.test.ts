import * as d from '../../main';
import { STRING } from '../../main/utils/type-system';

describe('never', () => {
  test('returns a never shape', () => {
    expect(d.never()).toBeInstanceOf(d.NeverShape);
  });

  test('never is erased in unions', () => {
    expect(d.or([d.string(), d.never()]).inputTypes).toEqual([STRING]);
  });

  test('never absorbs other types in intersections', () => {
    expect(d.and([d.string(), d.never()]).inputTypes).toEqual([]);
  });
});
