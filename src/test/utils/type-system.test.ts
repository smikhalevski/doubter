import { distributeTypes, intersectTypes, NUMBER, STRING, unionTypes, UNKNOWN } from '../../main/utils/type-system';

test('unionTypes', () => {
  expect(unionTypes([])).toEqual([]);
  expect(unionTypes([UNKNOWN])).toEqual([UNKNOWN]);
  expect(unionTypes([UNKNOWN, UNKNOWN])).toEqual([UNKNOWN]);
  expect(unionTypes([111])).toEqual([111]);
  expect(unionTypes([111, 111])).toEqual([111]);
  expect(unionTypes([111, NUMBER])).toEqual([NUMBER]);
  expect(unionTypes([NUMBER, 111])).toEqual([NUMBER]);
  expect(unionTypes([NUMBER, STRING])).toEqual([NUMBER, STRING]);
  expect(unionTypes([NUMBER, NUMBER])).toEqual([NUMBER]);
  expect(unionTypes([111, 'aaa'])).toEqual([111, 'aaa']);
  expect(unionTypes([111, 'aaa', UNKNOWN])).toEqual([UNKNOWN]);
  expect(unionTypes([STRING, UNKNOWN])).toEqual([UNKNOWN]);
});

test('intersectTypes', () => {
  expect(intersectTypes([])).toEqual([]);
  expect(intersectTypes([UNKNOWN])).toEqual([UNKNOWN]);
  expect(intersectTypes([UNKNOWN, UNKNOWN])).toEqual([UNKNOWN]);
  expect(intersectTypes([UNKNOWN, NUMBER, UNKNOWN])).toEqual([NUMBER]);
  expect(intersectTypes([111])).toEqual([111]);
  expect(intersectTypes([111, 111])).toEqual([111]);
  expect(intersectTypes([111, NUMBER])).toEqual([111]);
  expect(intersectTypes([NUMBER, 111])).toEqual([111]);
  expect(intersectTypes([111, 'aaa'])).toEqual([]);
  expect(intersectTypes([NUMBER, STRING])).toEqual([]);
  expect(intersectTypes([NUMBER, NUMBER])).toEqual([NUMBER]);
  expect(intersectTypes([NUMBER, UNKNOWN])).toEqual([NUMBER]);
});

test('distributeTypes', () => {
  expect(distributeTypes([])).toEqual([]);
  expect(distributeTypes([[], []])).toEqual([]);
  expect(distributeTypes([[STRING], []])).toEqual([]);
  expect(distributeTypes([[], [STRING]])).toEqual([]);
  expect(distributeTypes([[STRING], [STRING]])).toEqual([STRING]);
  expect(distributeTypes([[STRING], [NUMBER]])).toEqual([]);
  expect(distributeTypes([[STRING], ['aaa']])).toEqual(['aaa']);
  expect(distributeTypes([[STRING], ['aaa', NUMBER]])).toEqual(['aaa']);
  expect(distributeTypes([['aaa'], [STRING, NUMBER]])).toEqual(['aaa']);
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
      [NUMBER, STRING],
    ])
  ).toEqual([111, 'aaa']);
});
