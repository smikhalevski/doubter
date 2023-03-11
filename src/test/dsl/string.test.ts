import * as d from '../../main';
import { STRING } from '../../main/utils';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });

  test('returns input types for optional string', () => {
    expect(d.string().optional().inputTypes).toEqual([STRING, undefined]);
  });
});
