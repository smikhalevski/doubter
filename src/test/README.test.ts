import qs from 'qs';
import * as d from '../main';
import { CODE_UNION, MESSAGE_UNION } from '../main/constants';
import { TYPE_ARRAY, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_OBJECT, TYPE_STRING } from '../main/Type';

describe('Cookbook', () => {
  test('Rename object keys', () => {
    const keyShape = d.enum(['foo', 'bar']).transform(value => value.toUpperCase() as 'FOO' | 'BAR');

    const shape = d.record(keyShape, d.number());

    expect(shape.parse({ foo: 1, bar: 2 })).toStrictEqual({ FOO: 1, BAR: 2 });
  });

  test('Type-safe URL query params', () => {
    const queryShape = d
      .object({
        name: d.string(),
        age: d.int().nonNegative().catch(),
      })
      .partial();

    expect(queryShape.parse(qs.parse('name=Frodo&age=50'), { coerced: true })).toEqual({ name: 'Frodo', age: 50 });

    expect(queryShape.parse(qs.parse('age=-33'), { coerced: true })).toStrictEqual({ age: undefined });
  });

  test('Type-safe env variables', () => {
    const envShape = d
      .object({
        TS_JEST: d.int(),
        NODE_ENV: d.enum(['test', 'production']),
      })
      .strip();

    expect(envShape.parse(process.env, { coerced: true })).toEqual({
      NODE_ENV: 'test',
      TS_JEST: 1,
    });
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
          code: CODE_UNION,
          message: MESSAGE_UNION,
          input: value2,
          param: {
            inputs: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, null, TYPE_ARRAY, TYPE_OBJECT],
            issueGroups: null,
          },
        },
      ],
    });

    expect(jsonShape.try(value3)).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_UNION,
          input: value3.aaa.bbb,
          message: MESSAGE_UNION,
          param: {
            inputs: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, null, TYPE_ARRAY, TYPE_OBJECT],
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
          code: CODE_UNION,
          message: MESSAGE_UNION,
          input: value2,
          param: {
            inputs: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, null, TYPE_ARRAY, TYPE_OBJECT],
            issueGroups: null,
          },
        },
      ],
    });
  });
});

test('Overriding type coercion', () => {
  const yesNoShape = d.boolean().coerce(value => {
    if (value === 'yes') {
      return true;
    }
    if (value === 'no') {
      return false;
    }
    // Coercion is not possible
    return d.NEVER;
  });

  expect(d.array(yesNoShape).parse(['yes', 'no'])).toEqual([true, false]);
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
      protected _apply(input: unknown, options: d.ApplyOptions, nonce: number): d.Result<number> {
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

        // 2️⃣ Prepare the output value
        const output = parseFloat(input);

        // 3️⃣ Apply checks to the output value
        if (this._applyChecks) {
          const issues = this._applyChecks(output, null, options);

          if (issues !== null) {
            // 4️⃣ Return issues if the output value is invalid
            return issues;
          }
        }

        // 5️⃣ Return the parsing result
        return { ok: true, value: output };
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
