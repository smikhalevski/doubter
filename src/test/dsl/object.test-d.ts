import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<{ aaa?: string }>(
  d.object({
    aaa: d.string().optional(),
  })[_OUTPUT]
);

expectType<{ aaa?: any }>(
  d.object({
    aaa: d.any(),
  })[_OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(
  d.object({
    aaa: d.string(),
    bbb: d.number(),
  })[_OUTPUT]
);

expectType<{ aaa: string }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .pick(['aaa'])[_OUTPUT]
);

expectType<{ bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .omit(['aaa'])[_OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend({ bbb: d.number() })[_OUTPUT]);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() }))[_OUTPUT]);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial()[_OUTPUT]
);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .deepPartial()[_OUTPUT]
);

expectType<{ aaa?: string; bbb?: { ccc?: number } }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.object({ ccc: d.number() }),
    })
    .deepPartial()[_OUTPUT]
);

expectType<{ aaa?: string; bbb?: Array<number | undefined> }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.array(d.number()),
    })
    .deepPartial()[_OUTPUT]
);

const keys = ['aaa'] as const;

expectType<{ aaa: string }>(d.object({ aaa: d.string(), bbb: d.number() }).pick(keys)[_OUTPUT]);

expectType<{ bbb: number }>(d.object({ aaa: d.string(), bbb: d.number() }).omit(keys)[_OUTPUT]);

expectType<{ aaa?: string | undefined; bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial(keys)[_OUTPUT]
);

expectType<{ aaa: string; bbb: number }>(
  d
    .object({
      aaa: d.string().optional(),
      bbb: d.number(),
    })
    .required(keys)[_OUTPUT]
);
