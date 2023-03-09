import * as d from '../../main';
import { TYPE_NEVER, TYPE_STRING } from '../../main/constants';

describe('any', () => {
  test('returns a shape', () => {
    expect(d.any()).toBeInstanceOf(d.Shape);
  });

  test('unknown is erased in an intersection', () => {
    expect(d.and([d.string(), d.any()]).inputTypes).toEqual([TYPE_STRING]);
    expect(d.and([d.never(), d.any()]).inputTypes).toEqual([TYPE_NEVER]);
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
