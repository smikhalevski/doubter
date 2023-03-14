import * as d from '../../main';
import { TYPE_STRING } from '../../main/Type';

describe('never', () => {
  test('returns a never shape', () => {
    expect(d.never()).toBeInstanceOf(d.NeverShape);
  });

  test('never is erased in unions', () => {
    expect(d.or([d.string(), d.never()]).inputs).toEqual([TYPE_STRING]);
  });

  test('never absorbs other types in intersections', () => {
    expect(d.and([d.string(), d.never()]).inputs).toEqual([]);
  });
});
