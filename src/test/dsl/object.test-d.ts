import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';

test('expected types', () => {
  expectTypeOf(
    d.object({
      aaa: d.string().optional(),
    })['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string }>();

  expectTypeOf(
    d.object({
      aaa: d.any(),
    })['$inferOutput']
  ).toEqualTypeOf<{ aaa?: any }>();

  expectTypeOf(
    d.object({
      aaa: d.string(),
      bbb: d.number(),
    })['$inferOutput']
  ).toEqualTypeOf<{ aaa: string; bbb: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .pick(['aaa'])['$inferOutput']
  ).toEqualTypeOf<{ aaa: string }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .omit(['aaa'])['$inferOutput']
  ).toEqualTypeOf<{ bbb: number }>();

  expectTypeOf(d.object({ aaa: d.string() }).extend({ bbb: d.number() })['$inferOutput']).toEqualTypeOf<{
    aaa: string;
    bbb: number;
  }>();

  expectTypeOf(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() }))['$inferOutput']).toEqualTypeOf<{
    aaa: string;
    bbb: number;
  }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .partial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string; bbb?: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string; bbb?: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.object({ ccc: d.number() }),
      })
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string; bbb?: { ccc?: number } }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.array(d.number()),
      })
      .deepPartial()['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string; bbb?: Array<number | undefined> }>();

  const keys = ['aaa'] as const;

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).pick(keys)['$inferOutput']).toEqualTypeOf<{
    aaa: string;
  }>();

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).omit(keys)['$inferOutput']).toEqualTypeOf<{
    bbb: number;
  }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .partial(keys)['$inferOutput']
  ).toEqualTypeOf<{ aaa?: string | undefined; bbb: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string().optional(),
        bbb: d.number(),
      })
      .required(keys)['$inferOutput']
  ).toEqualTypeOf<{ aaa: string; bbb: number }>();

  d.object({ aaa: d.string(), bbb: d.number() }).notAllKeys(['bbb']);

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).readonly()['$inferInput']).toEqualTypeOf<{
    aaa: string;
    bbb: number;
  }>();

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).readonly()['$inferOutput']).toEqualTypeOf<{
    readonly aaa: string;
    readonly bbb: number;
  }>();
});
