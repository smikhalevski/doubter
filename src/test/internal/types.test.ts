import { expect, test } from 'vitest';
import { distributeTypes, unionTypes } from '../../main/internal/types.ts';
import { Type } from '../../main/Type.ts';

test('unionTypes', () => {
  expect(unionTypes([])).toEqual([]);
  expect(unionTypes([Type.UNKNOWN])).toEqual([Type.UNKNOWN]);
  expect(unionTypes([Type.UNKNOWN, Type.UNKNOWN])).toEqual([Type.UNKNOWN]);
  expect(unionTypes([111])).toEqual([111]);
  expect(unionTypes([111, 111])).toEqual([111]);
  expect(unionTypes([111, Type.NUMBER])).toEqual([Type.NUMBER]);
  expect(unionTypes([Type.NUMBER, 111])).toEqual([Type.NUMBER]);
  expect(unionTypes([Type.NUMBER, Type.STRING])).toEqual([Type.NUMBER, Type.STRING]);
  expect(unionTypes([Type.NUMBER, Type.NUMBER])).toEqual([Type.NUMBER]);
  expect(unionTypes([111, 'aaa'])).toEqual([111, 'aaa']);
  expect(unionTypes([111, 'aaa', Type.UNKNOWN])).toEqual([Type.UNKNOWN]);
  expect(unionTypes([Type.STRING, Type.UNKNOWN])).toEqual([Type.UNKNOWN]);
});

test('distributeTypes', () => {
  expect(distributeTypes([])).toEqual([]);
  expect(distributeTypes([[], []])).toEqual([]);
  expect(distributeTypes([[Type.STRING], []])).toEqual([]);
  expect(distributeTypes([[], [Type.STRING]])).toEqual([]);
  expect(distributeTypes([[Type.STRING], [Type.STRING]])).toEqual([Type.STRING]);
  expect(distributeTypes([[Type.STRING], [Type.NUMBER]])).toEqual([]);
  expect(distributeTypes([[Type.STRING], ['aaa']])).toEqual(['aaa']);
  expect(distributeTypes([[Type.STRING], ['aaa', Type.NUMBER]])).toEqual(['aaa']);
  expect(distributeTypes([['aaa'], [Type.STRING, Type.NUMBER]])).toEqual(['aaa']);
  expect(
    distributeTypes([
      [111, 'aaa'],
      ['aaa', 111],
    ])
  ).toEqual([111, 'aaa']);
  expect(distributeTypes([[111, 'aaa'], ['aaa']])).toEqual(['aaa']);
  expect(
    distributeTypes([
      [111, 'aaa'],
      [Type.NUMBER, Type.STRING],
    ])
  ).toEqual([111, 'aaa']);
});
