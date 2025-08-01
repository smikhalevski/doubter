import { describe, expect, test } from 'vitest';
import qs from 'qs';
import * as d from '../main/index.js';
import { Result } from '../main/index.js';
import { CODE_TYPE_UNION, MESSAGE_TYPE_UNION } from '../main/constants.js';
import { Type } from '../main/Type.js';

describe('Cookbook', () => {
  test('Type-safe URL query params', () => {
    const queryShape = d
      .object({
        name: d.string(),
        age: d.number().int().nonNegative().coerce().catch(),
      })
      .partial();

    expect(queryShape.parse(qs.parse('name=Frodo&age=50'))).toEqual({ name: 'Frodo', age: 50 });

    expect(queryShape.parse(qs.parse('age=-33'))).toStrictEqual({ age: undefined });
  });

  test('Type-safe env variables', () => {
    const processEnv = { NODE_ENV: 'test' };

    const envShape = d
      .object({
        NODE_ENV: d.enum(['test', 'production']),
        HELLO_DATE: d.date().coerce().optional(),
      })
      .strip();

    expect(envShape.parse(processEnv)).toEqual({
      NODE_ENV: 'test',
    });

    expect(envShape.parse({ NODE_ENV: 'test', HELLO_DATE: '1980-12-09' })).toEqual({
      NODE_ENV: 'test',
      HELLO_DATE: new Date('1980-12-09'),
    });
  });

  test('Type-safe localStorage', () => {
    // Mock localStorage
    const localStorageData: Record<string, string> = {};
    const localStorage = {
      getItem(key: string) {
        return localStorageData[key] || null;
      },
      setItem(key: string, value: string) {
        localStorageData[key] = value;
      },
    };

    const userShape = d.object({
      name: d.string(),
      age: d.number().int().positive(),
    });

    const localStorageDataShape = d.object({
      user: userShape,
    });

    type LocalStorageData = d.Input<typeof localStorageDataShape>;

    function getItem<K extends keyof LocalStorageData>(key: K): LocalStorageData[K] | null {
      const valueShape = localStorageDataShape.at(key);
      const value = localStorage.getItem(key);

      if (valueShape === null) {
        throw new Error('Unknown key: ' + key);
      }
      if (value === null) {
        return null;
      }
      return valueShape.parse(JSON.parse(value));
    }

    function setItem<K extends keyof LocalStorageData>(key: K, value: LocalStorageData[K]): void {
      const valueShape = localStorageDataShape.at(key);

      if (valueShape === null) {
        throw new Error('Unknown key: ' + key);
      }
      localStorage.setItem(key, JSON.stringify(valueShape.parse(value)));
    }

    setItem('user', { name: 'John', age: 42 });

    expect(localStorageData.user).toBe('{"name":"John","age":42}');

    expect(getItem('user')).toEqual({ name: 'John', age: 42 });

    expect(() => getItem('account' as any)).toThrow('Unknown key: account');
  });

  test('Rename object keys', () => {
    const keyShape = d.enum(['foo', 'bar']).convert(value => value.toUpperCase() as 'FOO' | 'BAR');

    const shape = d.record(keyShape, d.number());

    expect(shape.parse({ foo: 1, bar: 2 })).toStrictEqual({ FOO: 1, BAR: 2 });
  });
});

describe('JSON shape', () => {
  type JSON = number | string | boolean | null | JSON[] | { [key: string]: JSON };

  test('parses JSON', () => {
    const jsonShape: d.Shape<JSON> = d.lazy(() =>
      d.or([d.number(), d.string(), d.boolean(), d.null(), d.array(jsonShape), d.record(jsonShape)])
    );

    const value1 = { aaa: { bbb: 111 } };
    const value2 = Symbol();
    const value3 = { aaa: { bbb: Symbol() } };

    expect(jsonShape.parse(value1)).toBe(value1);

    expect(jsonShape.try(value2)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_UNION,
          message: MESSAGE_TYPE_UNION,
          input: value2,
          param: {
            inputs: [Type.NUMBER, Type.STRING, Type.BOOLEAN, null, Type.ARRAY, Type.OBJECT],
            issueGroups: null,
          },
        },
      ],
    });

    expect(jsonShape.try(value3)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_UNION,
          input: value3.aaa.bbb,
          message: MESSAGE_TYPE_UNION,
          param: {
            inputs: [Type.NUMBER, Type.STRING, Type.BOOLEAN, null, Type.ARRAY, Type.OBJECT],
            issueGroups: null,
          },
          path: ['aaa', 'bbb'],
        },
      ],
    });
  });

  test('defer lazy usage', () => {
    const jsonShape: d.Shape<JSON> = d.or([
      d.number(),
      d.string(),
      d.boolean(),
      d.null(),
      d.array(d.lazy(() => jsonShape)),
      d.record(d.lazy(() => jsonShape)),
    ]);

    const value1 = { aaa: { bbb: 111 } };
    const value2 = Symbol();

    expect(jsonShape.parse(value1)).toBe(value1);

    expect(jsonShape.try(value2)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_TYPE_UNION,
          message: MESSAGE_TYPE_UNION,
          input: value2,
          param: {
            inputs: [Type.NUMBER, Type.STRING, Type.BOOLEAN, null, Type.ARRAY, Type.OBJECT],
            issueGroups: null,
          },
        },
      ],
    });
  });
});

test('Circular object references', () => {
  interface User {
    friends: User[];
  }

  const hank: User = {
    friends: [],
  };

  // 🟡 The circular reference
  hank.friends.push(hank);

  const userShape: d.Shape<User> = d.lazy(() =>
    d.object({
      friends: d.array(userShape),
    })
  );

  expect(userShape.parse(hank)).toBe(hank);
  expect(userShape.parse(hank).friends![0]).toBe(hank);
});

describe('Advanced shapes', () => {
  test('NumberLikeShape', () => {
    class NumberLikeShape extends d.Shape<string, number> {
      protected _apply(input: unknown, options: d.ParseOptions, _nonce: number): d.Result<number> {
        // 1️⃣ Validate the input and return issues if it is invalid
        if (typeof input !== 'string' || isNaN(parseFloat(input))) {
          return [
            {
              code: 'kaputs',
              message: 'Must be a number-like',
              input,
            },
          ];
        }

        // 2️⃣ Apply operations to the output value
        return this._applyOperations(input, parseFloat(input), options, null) as Result;
      }
    }

    const shape = d.array(new NumberLikeShape());

    expect(shape.parse(['42', '33'])).toEqual([42, 33]);
    expect(shape.try(['seventeen'])).toEqual({
      ok: false,
      issues: [{ code: 'kaputs', message: 'Must be a number-like', input: 'seventeen', path: [0] }],
    });
  });
});
