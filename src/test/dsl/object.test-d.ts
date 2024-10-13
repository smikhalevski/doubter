import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal/shapes';

expectType<{ aaa?: string }>(
  d.object({
    aaa: d.string().optional(),
  })[OUTPUT]
);

expectType<{ aaa?: any }>(
  d.object({
    aaa: d.any(),
  })[OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(
  d.object({
    aaa: d.string(),
    bbb: d.number(),
  })[OUTPUT]
);

expectType<{ aaa: string }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .pick(['aaa'])[OUTPUT]
);

expectType<{ bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .omit(['aaa'])[OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend({ bbb: d.number() })[OUTPUT]);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() }))[OUTPUT]);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial()[OUTPUT]
);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .deepPartial()[OUTPUT]
);

expectType<{ aaa?: string; bbb?: { ccc?: number } }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.object({ ccc: d.number() }),
    })
    .deepPartial()[OUTPUT]
);

expectType<{ aaa?: string; bbb?: Array<number | undefined> }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.array(d.number()),
    })
    .deepPartial()[OUTPUT]
);

const keys = ['aaa'] as const;

expectType<{ aaa: string }>(d.object({ aaa: d.string(), bbb: d.number() }).pick(keys)[OUTPUT]);

expectType<{ bbb: number }>(d.object({ aaa: d.string(), bbb: d.number() }).omit(keys)[OUTPUT]);

expectType<{ aaa?: string | undefined; bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial(keys)[OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(
  d
    .object({
      aaa: d.string().optional(),
      bbb: d.number(),
    })
    .required(keys)[OUTPUT]
);

d.object({ aaa: d.string(), bbb: d.number() }).notAllKeys(['bbb']);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string(), bbb: d.number() }).readonly()[INPUT]);

expectType<{ readonly aaa: string; readonly bbb: number }>(
  d.object({ aaa: d.string(), bbb: d.number() }).readonly()[OUTPUT]
);
