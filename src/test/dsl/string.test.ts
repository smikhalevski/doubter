import * as d from '../../main';
import { TYPE_STRING } from '../../main/Type';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });

  test('returns input types for optional string', () => {
    expect(d.string().optional().inputs).toEqual([TYPE_STRING, undefined]);
  });
});
