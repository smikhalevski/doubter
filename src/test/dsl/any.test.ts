import * as d from '../../main';
import { TYPE_STRING } from '../../main/types';

describe('any', () => {
  test('returns a shape', () => {
    expect(d.any()).toBeInstanceOf(d.Shape);
  });

  test('unknown is erased in an intersection', () => {
    expect(d.and([d.string(), d.any()]).inputs).toEqual([TYPE_STRING]);
    expect(d.and([d.never(), d.any()]).inputs).toEqual([]);
  });

  test('returns a shape with a refinement', () => {
    const cb = () => true;

    expect(d.any(cb).operations[0]).toEqual({
      type: cb,
      param: undefined,
      factory: expect.any(Function),
    });
  });
});
