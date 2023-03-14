import * as d from '../../main';
import { TYPE_NUMBER, TYPE_STRING } from '../../main/Type';

describe('union', () => {
  test('returns a union shape', () => {
    const shape = d.union([d.string(), d.number()]);

    expect(shape).toBeInstanceOf(d.UnionShape);
    expect(shape.inputs).toEqual([TYPE_STRING, TYPE_NUMBER]);

    expect(d.or([d.string()])).toBeInstanceOf(d.UnionShape);
  });
});
