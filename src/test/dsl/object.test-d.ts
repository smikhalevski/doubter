import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('expected types', () => {
  expectTypeOf(
    d.object({
      aaa: d.string().optional(),
    })[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string }>();

  expectTypeOf(
    d.object({
      aaa: d.any(),
    })[OUTPUT]
  ).toEqualTypeOf<{ aaa?: any }>();

  expectTypeOf(
    d.object({
      aaa: d.string(),
      bbb: d.number(),
    })[OUTPUT]
  ).toEqualTypeOf<{ aaa: string; bbb: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .pick(['aaa'])[OUTPUT]
  ).toEqualTypeOf<{ aaa: string }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .omit(['aaa'])[OUTPUT]
  ).toEqualTypeOf<{ bbb: number }>();

  expectTypeOf(d.object({ aaa: d.string() }).extend({ bbb: d.number() })[OUTPUT]).toEqualTypeOf<{
    aaa: string;
    bbb: number;
  }>();

  expectTypeOf(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() }))[OUTPUT]).toEqualTypeOf<{
    aaa: string;
    bbb: number;
  }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .partial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string; bbb?: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string; bbb?: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.object({ ccc: d.number() }),
      })
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string; bbb?: { ccc?: number } }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.array(d.number()),
      })
      .deepPartial()[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string; bbb?: Array<number | undefined> }>();

  const keys = ['aaa'] as const;

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).pick(keys)[OUTPUT]).toEqualTypeOf<{ aaa: string }>();

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).omit(keys)[OUTPUT]).toEqualTypeOf<{ bbb: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string(),
        bbb: d.number(),
      })
      .partial(keys)[OUTPUT]
  ).toEqualTypeOf<{ aaa?: string | undefined; bbb: number }>();

  expectTypeOf(
    d
      .object({
        aaa: d.string().optional(),
        bbb: d.number(),
      })
      .required(keys)[OUTPUT]
  ).toEqualTypeOf<{ aaa: string; bbb: number }>();

  d.object({ aaa: d.string(), bbb: d.number() }).notAllKeys(['bbb']);

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).readonly()[INPUT]).toEqualTypeOf<{
    aaa: string;
    bbb: number;
  }>();

  expectTypeOf(d.object({ aaa: d.string(), bbb: d.number() }).readonly()[OUTPUT]).toEqualTypeOf<{
    readonly aaa: string;
    readonly bbb: number;
  }>();
});
