import { describe, expect, test } from 'vitest';
import { ObjectShape } from '../../main/index.js';
import {
  CODE_OBJECT_ALL_KEYS,
  CODE_OBJECT_MAX_KEY_COUNT,
  CODE_OBJECT_MIN_KEY_COUNT,
  CODE_OBJECT_OR_KEYS,
  CODE_OBJECT_OXOR_KEYS,
  CODE_OBJECT_PLAIN,
  CODE_OBJECT_XOR_KEYS,
  MESSAGE_OBJECT_PLAIN,
} from '../../main/constants.js';
import { MockShape } from '../shape/mocks.js';

describe('plain', () => {
  const shape = new ObjectShape({}, null).plain();

  test('raises if object is not plain', () => {
    expect(shape.parse({})).toEqual({});

    expect(shape.try(new (class {})())).toEqual({
      ok: false,
      issues: [{ code: CODE_OBJECT_PLAIN, input: {}, message: MESSAGE_OBJECT_PLAIN, param: undefined }],
    });
  });

  test('detects plain objects', () => {
    expect(shape.try({}).ok).toBe(true);
    expect(shape.try({ a: 1 }).ok).toBe(true);
    expect(shape.try({ constructor: () => undefined }).ok).toBe(true);
    expect(shape.try([1, 2, 3]).ok).toBe(false);
  });

  test('returns true for objects with a [[Prototype]] of null', () => {
    expect(shape.try(Object.create(null)).ok).toBe(true);
  });

  test('returns false for non-Object objects', () => {
    expect(shape.try(Error).ok).toBe(false);
  });
});

describe('minKeyCount', () => {
  test('raises if object contains excessive number of keys', () => {
    const shape = new ObjectShape({ key1: new MockShape(), key2: new MockShape(), key3: new MockShape() }, null)
      .partial()
      .minKeyCount(2);

    expect(shape.try({ key1: 111, key2: 222 }).ok).toBe(true);
    expect(shape.try({ key1: 111, key2: 222, key3: 333 }).ok).toBe(true);

    expect(shape.try({ key1: 111 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_MIN_KEY_COUNT,
          input: { key1: 111 },
          message: 'Must have a minimum of 2 keys',
          param: 2,
        },
      ],
    });
  });

  test('pluralizes word "key" in default issue message', () => {
    const shape = new ObjectShape({ key1: new MockShape(), key2: new MockShape() }, null).partial().minKeyCount(1);

    expect(shape.try({})).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_MIN_KEY_COUNT,
          input: {},
          message: 'Must have a minimum of 1 key',
          param: 1,
        },
      ],
    });
  });
});

describe('maxKeyCount', () => {
  test('raises if object contains insufficient number of keys', () => {
    const shape = new ObjectShape(
      { key1: new MockShape(), key2: new MockShape(), key3: new MockShape(), key4: new MockShape() },
      null
    )
      .partial()
      .maxKeyCount(3);

    expect(shape.try({}).ok).toBe(true);
    expect(shape.try({ key1: 111, key2: 222 }).ok).toBe(true);
    expect(shape.try({ key1: 111, key2: 222, key3: 333 }).ok).toBe(true);

    expect(shape.try({ key1: 111, key2: 222, key3: 333, key4: 444 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_MAX_KEY_COUNT,
          input: { key1: 111, key2: 222, key3: 333, key4: 444 },
          message: 'Must have a maximum of 3 keys',
          param: 3,
        },
      ],
    });
  });

  test('pluralizes word "key" in default issue message', () => {
    const shape = new ObjectShape({ key1: new MockShape(), key2: new MockShape() }, null).partial().maxKeyCount(1);

    expect(shape.try({ key1: 111, key2: 222 })).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_OBJECT_MAX_KEY_COUNT,
          input: { key1: 111, key2: 222 },
          message: 'Must have a maximum of 1 key',
          param: 1,
        },
      ],
    });
  });
});

describe('nonEmpty', () => {
  test('raises if object does not have at least one key', () => {
    const shape = new ObjectShape({ key1: new MockShape(), key2: new MockShape() }, null).partial().nonEmpty();

    expect(shape.try({}).ok).toBe(false);
    expect(shape.try({ key1: 111 }).ok).toBe(true);
    expect(shape.try({ key1: 111, key2: 222 }).ok).toBe(true);
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
          message: 'Must contain all or no keys: "key1", "key3", "key4"',
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
          message: 'Must contain at least one key: "key1", "key3", "key4"',
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
          message: 'Must contain exactly one key: "key1", "key3", "key4"',
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
          message: 'Must contain one or no keys: "key1", "key3", "key4"',
          param: ['key1', 'key3', 'key4'],
        },
      ],
    });
  });
});
