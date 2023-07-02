import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<{ aaa?: string }>(
  d.object({
    aaa: d.string().optional(),
  })[d.OUTPUT]
);

expectType<{ aaa?: any }>(
  d.object({
    aaa: d.any(),
  })[d.OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(
  d.object({
    aaa: d.string(),
    bbb: d.number(),
  })[d.OUTPUT]
);

expectType<{ aaa: string }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .pick(['aaa'])[d.OUTPUT]
);

expectType<{ bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .omit(['aaa'])[d.OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend({ bbb: d.number() })[d.OUTPUT]);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() }))[d.OUTPUT]);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial()[d.OUTPUT]
);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .deepPartial()[d.OUTPUT]
);

expectType<{ aaa?: string; bbb?: { ccc?: number } }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.object({ ccc: d.number() }),
    })
    .deepPartial()[d.OUTPUT]
);

expectType<{ aaa?: string; bbb?: Array<number | undefined> }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.array(d.number()),
    })
    .deepPartial()[d.OUTPUT]
);

const keys = ['aaa'] as const;

expectType<{ aaa: string }>(d.object({ aaa: d.string(), bbb: d.number() }).pick(keys)[d.OUTPUT]);

expectType<{ bbb: number }>(d.object({ aaa: d.string(), bbb: d.number() }).omit(keys)[d.OUTPUT]);

expectType<{ aaa?: string | undefined; bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial(keys)[d.OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(
  d
    .object({
      aaa: d.string().optional(),
      bbb: d.number(),
    })
    .required(keys)[d.OUTPUT]
);
