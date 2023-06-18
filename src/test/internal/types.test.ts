import { distributeTypes, unionTypes } from '../../main/internal';
import { TYPE_NUMBER, TYPE_STRING, TYPE_UNKNOWN } from '../../main/Type';

test('unionTypes', () => {
  expect(unionTypes([])).toEqual([]);
  expect(unionTypes([TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
  expect(unionTypes([TYPE_UNKNOWN, TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
  expect(unionTypes([111])).toEqual([111]);
  expect(unionTypes([111, 111])).toEqual([111]);
  expect(unionTypes([111, TYPE_NUMBER])).toEqual([TYPE_NUMBER]);
  expect(unionTypes([TYPE_NUMBER, 111])).toEqual([TYPE_NUMBER]);
  expect(unionTypes([TYPE_NUMBER, TYPE_STRING])).toEqual([TYPE_NUMBER, TYPE_STRING]);
  expect(unionTypes([TYPE_NUMBER, TYPE_NUMBER])).toEqual([TYPE_NUMBER]);
  expect(unionTypes([111, 'aaa'])).toEqual([111, 'aaa']);
  expect(unionTypes([111, 'aaa', TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
  expect(unionTypes([TYPE_STRING, TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
});

test('distributeTypes', () => {
  expect(distributeTypes([])).toEqual([]);
  expect(distributeTypes([[], []])).toEqual([]);
  expect(distributeTypes([[TYPE_STRING], []])).toEqual([]);
  expect(distributeTypes([[], [TYPE_STRING]])).toEqual([]);
  expect(distributeTypes([[TYPE_STRING], [TYPE_STRING]])).toEqual([TYPE_STRING]);
  expect(distributeTypes([[TYPE_STRING], [TYPE_NUMBER]])).toEqual([]);
  expect(distributeTypes([[TYPE_STRING], ['aaa']])).toEqual(['aaa']);
  expect(distributeTypes([[TYPE_STRING], ['aaa', TYPE_NUMBER]])).toEqual(['aaa']);
  expect(distributeTypes([['aaa'], [TYPE_STRING, TYPE_NUMBER]])).toEqual(['aaa']);
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
      [TYPE_NUMBER, TYPE_STRING],
    ])
  ).toEqual([111, 'aaa']);
});
