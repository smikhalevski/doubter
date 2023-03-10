import * as d from '../../main';
import { NUMBER, STRING } from '../../main/utils/type-system';

describe('union', () => {
  test('returns a union shape', () => {
    const shape = d.union([d.string(), d.number()]);

    expect(shape).toBeInstanceOf(d.UnionShape);
    expect(shape.inputTypes).toEqual([STRING, NUMBER]);

    expect(d.or([d.string()])).toBeInstanceOf(d.UnionShape);
  });
});
