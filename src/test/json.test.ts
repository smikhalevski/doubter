import * as d from '../main';
import { CODE_UNION, MESSAGE_UNION } from '../main/constants';

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
      issues: [{ code: CODE_UNION, message: MESSAGE_UNION, input: value2, path: [], param: [], meta: undefined }],
    });

    expect(jsonShape.try(value3)).toEqual({
      ok: false,
      issues: [{ code: CODE_UNION, input: value3.aaa.bbb, message: MESSAGE_UNION, param: [], path: ['aaa', 'bbb'] }],
    });
  });
});
