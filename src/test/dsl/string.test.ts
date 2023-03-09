import * as d from '../../main';
import { TYPE_STRING, TYPE_UNDEFINED } from '../../main/constants';

describe('string', () => {
  test('returns a string shape', () => {
    expect(d.string()).toBeInstanceOf(d.StringShape);
  });

  test('returns input types for optional string', () => {
    expect(d.string().optional().inputTypes).toEqual([TYPE_STRING, TYPE_UNDEFINED]);
  });
});
