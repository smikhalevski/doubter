import { ObjectShape } from '../../main';
import {
  CODE_OBJECT_ALL_KEYS,
  CODE_OBJECT_OR_KEYS,
  CODE_OBJECT_XOR_KEYS,
  CODE_OBJECT_PLAIN,
  MESSAGE_OBJECT_PLAIN,
  CODE_OBJECT_OXOR_KEYS,
} from '../../main/constants';
import { MockShape } from '../shapes/mocks';

describe('plain', () => {
  test('raises if object is not plain', () => {
    const shape = new ObjectShape({}, null).plain();

    expect(shape.parse({})).toEqual({});

    expect(shape.try(new (class {})())).toEqual({
      ok: false,
      issues: [{ code: CODE_OBJECT_PLAIN, input: {}, message: MESSAGE_OBJECT_PLAIN, param: undefined }],
    });
  });
});

describe('allKeys', () => {
  test('raises if object contains insufficient number of keys', () => {
    const shape = new ObjectShape(
      { key1: new MockShape(), key2: new MockShape(), key3: new MockShape(), key4: new MockShape() },
      null
    ).allKeys(['key1', 'key3', 'key4']);

    expect(shape.try({}).ok).toBe(true);
    expect(shape.try({ key1: 111, key2: 222, key3: 333, key4: 444 }).ok).toBe(true);
    expect(shape.try({ key1: 111, key3: 333, key4: 444 }).ok).toBe(true);

    expect(shape.try({ key1: 111, key2: 222, key3: 333 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_ALL_KEYS,
          input: { key1: 111, key2: 222, key3: 333 },
          message: 'Must contain all or no keys: key1,key3,key4',
          param: ['key1', 'key3', 'key4'],
        },
      ],
    });
  });
});

describe('orKeys', () => {
  test('raises if object contains none of keys', () => {
    const shape = new ObjectShape(
      { key1: new MockShape(), key2: new MockShape(), key3: new MockShape(), key4: new MockShape() },
      null
    ).orKeys(['key1', 'key3', 'key4']);

    expect(shape.try({ key1: 111, key2: 222, key3: 333, key4: 444 }).ok).toBe(true);
    expect(shape.try({ key1: 111, key3: 333, key4: 444 }).ok).toBe(true);
    expect(shape.try({ key1: 111, key3: 333 }).ok).toBe(true);
    expect(shape.try({ key3: 333 }).ok).toBe(true);

    expect(shape.try({ key2: 222 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_OR_KEYS,
          input: { key2: 222 },
          message: 'Must contain at least one key: key1,key3,key4',
          param: ['key1', 'key3', 'key4'],
        },
      ],
    });
  });
});

describe('xorKeys', () => {
  test('raises if object does not contain exactly one key', () => {
    const shape = new ObjectShape(
      { key1: new MockShape(), key2: new MockShape(), key3: new MockShape(), key4: new MockShape() },
      null
    ).xorKeys(['key1', 'key3', 'key4']);

    expect(shape.try({ key1: 111, key2: 222, key3: 333, key4: 444 }).ok).toBe(false);
    expect(shape.try({ key1: 111, key3: 333, key4: 444 }).ok).toBe(false);
    expect(shape.try({ key1: 111, key3: 333 }).ok).toBe(false);
    expect(shape.try({ key3: 333 }).ok).toBe(true);

    expect(shape.try({ key2: 222 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_XOR_KEYS,
          input: { key2: 222 },
          message: 'Must contain exactly one key: key1,key3,key4',
          param: ['key1', 'key3', 'key4'],
        },
      ],
    });
  });
});

describe('oxorKeys', () => {
  test('raises if object does not contains more than one key', () => {
    const shape = new ObjectShape(
      { key1: new MockShape(), key2: new MockShape(), key3: new MockShape(), key4: new MockShape() },
      null
    ).oxorKeys(['key1', 'key3', 'key4']);

    expect(shape.try({ key1: 111, key2: 222, key3: 333, key4: 444 }).ok).toBe(false);
    expect(shape.try({ key1: 111, key3: 333, key4: 444 }).ok).toBe(false);
    expect(shape.try({ key3: 333 }).ok).toBe(true);
    expect(shape.try({ key2: 222 }).ok).toBe(true);

    expect(shape.try({ key1: 111, key3: 333 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_OXOR_KEYS,
          input: { key1: 111, key3: 333 },
          message: 'Must contain one or no keys: key1,key3,key4',
          param: ['key1', 'key3', 'key4'],
        },
      ],
    });
  });
});
