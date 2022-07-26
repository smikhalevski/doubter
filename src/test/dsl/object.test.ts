import { number, object, ObjectType } from '../../main';

describe('object', () => {
  test('returns an object type', () => {
    expect(object({ foo: number() })).toBeInstanceOf(ObjectType);
  });
});
