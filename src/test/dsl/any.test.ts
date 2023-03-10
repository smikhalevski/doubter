import * as d from '../../main';
import { STRING } from '../../main/utils/type-system';

describe('any', () => {
  test('returns a shape', () => {
    expect(d.any()).toBeInstanceOf(d.Shape);
  });

  test('unknown is erased in an intersection', () => {
    expect(d.and([d.string(), d.any()]).inputTypes).toEqual([STRING]);
    expect(d.and([d.never(), d.any()]).inputTypes).toEqual([]);
  });

  test('returns a shape with a refinement', () => {
    const cb = () => true;

    expect(d.any(cb).getCheck(cb)).toEqual({
      key: cb,
      callback: expect.any(Function),
      isUnsafe: false,
    });
  });
});
