import qs from 'qs';
import * as d from '../main';
import {
  CODE_UNION,
  MESSAGE_UNION,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../main/constants';

describe('Cookbook', () => {
  test('rename keys', () => {
    const keyShape = d.enum(['foo', 'bar']).transform(value => value.toUpperCase() as 'FOO' | 'BAR');

    const shape = d.record(keyShape, d.number());

    expect(shape.parse({ foo: 1, bar: 2 })).toStrictEqual({ FOO: 1, BAR: 2 });
  });

  test('query strings', () => {
    const queryShape = d.object({
      name: d.string().optional(),
      age: d.int().coerce().gt(0).catch().optional(),
    });

    expect(queryShape.parse(qs.parse('name=Frodo&age=50'))).toEqual({ name: 'Frodo', age: 50 });

    expect(queryShape.parse(qs.parse('age=-33'))).toStrictEqual({ age: undefined });
  });
});

describe('JSON shape', () => {
  type JSON = number | string | boolean | null | JSON[] | { [key: string]: JSON };

  test('can parse JSON', () => {
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
          path: [],
          param: {
            inputTypes: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_NULL, TYPE_ARRAY, TYPE_OBJECT],
            issueGroups: null,
          },
          meta: undefined,
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
            inputTypes: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_NULL, TYPE_ARRAY, TYPE_OBJECT],
            issueGroups: null,
          },
          path: ['aaa', 'bbb'],
        },
      ],
    });
  });
});
