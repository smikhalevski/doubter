import { number, object, ObjectShape } from '../../main';

describe('object', () => {
  test('returns an object shape', () => {
    expect(object({ foo: number() })).toBeInstanceOf(ObjectShape);
  });
});
