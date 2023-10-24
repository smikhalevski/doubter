import { distributeInputs, unionInputs } from '../../main/internal/types';
import { TYPE_NUMBER, TYPE_STRING, TYPE_UNKNOWN } from '../../main/types';

test('unionInputs', () => {
  expect(unionInputs([])).toEqual([]);
  expect(unionInputs([TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
  expect(unionInputs([TYPE_UNKNOWN, TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
  expect(unionInputs([111])).toEqual([111]);
  expect(unionInputs([111, 111])).toEqual([111]);
  expect(unionInputs([111, TYPE_NUMBER])).toEqual([TYPE_NUMBER]);
  expect(unionInputs([TYPE_NUMBER, 111])).toEqual([TYPE_NUMBER]);
  expect(unionInputs([TYPE_NUMBER, TYPE_STRING])).toEqual([TYPE_NUMBER, TYPE_STRING]);
  expect(unionInputs([TYPE_NUMBER, TYPE_NUMBER])).toEqual([TYPE_NUMBER]);
  expect(unionInputs([111, 'aaa'])).toEqual([111, 'aaa']);
  expect(unionInputs([111, 'aaa', TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
  expect(unionInputs([TYPE_STRING, TYPE_UNKNOWN])).toEqual([TYPE_UNKNOWN]);
});

test('distributeInputs', () => {
  expect(distributeInputs([])).toEqual([]);
  expect(distributeInputs([[], []])).toEqual([]);
  expect(distributeInputs([[TYPE_STRING], []])).toEqual([]);
  expect(distributeInputs([[], [TYPE_STRING]])).toEqual([]);
  expect(distributeInputs([[TYPE_STRING], [TYPE_STRING]])).toEqual([TYPE_STRING]);
  expect(distributeInputs([[TYPE_STRING], [TYPE_NUMBER]])).toEqual([]);
  expect(distributeInputs([[TYPE_STRING], ['aaa']])).toEqual(['aaa']);
  expect(distributeInputs([[TYPE_STRING], ['aaa', TYPE_NUMBER]])).toEqual(['aaa']);
  expect(distributeInputs([['aaa'], [TYPE_STRING, TYPE_NUMBER]])).toEqual(['aaa']);
  expect(
    distributeInputs([
      [111, 'aaa'],
      ['aaa', 111],
    ])
  ).toEqual([111, 'aaa']);
  expect(distributeInputs([[111, 'aaa'], ['aaa']])).toEqual(['aaa']);
  expect(
    distributeInputs([
      [111, 'aaa'],
      [TYPE_NUMBER, TYPE_STRING],
    ])
  ).toEqual([111, 'aaa']);
});
