import * as d from '../../main';
import { TYPE_STRING } from '../../main/types';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });

  test('returns inputs for optional string', () => {
    expect(d.string().optional().inputs).toEqual([TYPE_STRING, undefined]);
  });
});
