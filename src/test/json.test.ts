import * as d from '../main';
import {
  CODE_UNION,
  TYPE_ARRAY,
  TYPE_BOOLEAN,
  TYPE_NULL,
  TYPE_NUMBER,
  TYPE_OBJECT,
  TYPE_STRING,
} from '../main/constants';

type Json = number | string | boolean | null | Json[] | { [key: string]: Json };

describe('JSON shape', () => {
  test('can parse JSON', () => {
    const jsonShape: d.Shape<Json> = d.lazy(() =>
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
          message: 'Must conform a union of number,string,boolean,null,array,object',
          input: value2,
          path: [],
          param: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_NULL, TYPE_ARRAY, TYPE_OBJECT],
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
          message: 'Must conform a union of number,string,boolean,null,array,object',
          param: [TYPE_NUMBER, TYPE_STRING, TYPE_BOOLEAN, TYPE_NULL, TYPE_ARRAY, TYPE_OBJECT],
          path: ['aaa', 'bbb'],
        },
      ],
    });
  });
});
