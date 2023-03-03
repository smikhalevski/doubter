import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<{ aaa?: string }>(
  d.object({
    aaa: d.string().optional(),
  }).output
);

expectType<{ aaa?: any }>(
  d.object({
    aaa: d.any(),
  }).output
);

expectType<{ aaa: string; bbb: number }>(
  d.object({
    aaa: d.string(),
    bbb: d.number(),
  }).output
);

expectType<{ aaa: string }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .pick(['aaa']).output
);

expectType<{ bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .omit(['aaa']).output
);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend({ bbb: d.number() }).output);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() })).output);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial().output
);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .deepPartial().output
);

expectType<{ aaa?: string; bbb?: { ccc?: number } }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.object({ ccc: d.number() }),
    })
    .deepPartial().output
);

expectType<{ aaa?: string; bbb?: Array<number | undefined> }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.array(d.number()),
    })
    .deepPartial().output
);
