import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<{ aaa?: string }>(
  d.object({
    aaa: d.string().optional(),
  }).__output
);

expectType<{ aaa?: any }>(
  d.object({
    aaa: d.any(),
  }).__output
);

expectType<{ aaa: string; bbb: number }>(
  d.object({
    aaa: d.string(),
    bbb: d.number(),
  }).__output
);

expectType<{ aaa: string }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .pick(['aaa']).__output
);

expectType<{ bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .omit(['aaa']).__output
);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend({ bbb: d.number() }).__output);

expectType<{ aaa: string; bbb: number }>(d.object({ aaa: d.string() }).extend(d.object({ bbb: d.number() })).__output);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial().__output
);

expectType<{ aaa?: string; bbb?: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .deepPartial().__output
);

expectType<{ aaa?: string; bbb?: { ccc?: number } }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.object({ ccc: d.number() }),
    })
    .deepPartial().__output
);

expectType<{ aaa?: string; bbb?: Array<number | undefined> }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.array(d.number()),
    })
    .deepPartial().__output
);

const keys = ['aaa'] as const;

expectType<{ aaa: string }>(d.object({ aaa: d.string(), bbb: d.number() }).pick(keys).__output);

expectType<{ bbb: number }>(d.object({ aaa: d.string(), bbb: d.number() }).omit(keys).__output);

expectType<{ aaa?: string | undefined; bbb: number }>(
  d
    .object({
      aaa: d.string(),
      bbb: d.number(),
    })
    .partial(keys).__output
);

expectType<{ aaa: string; bbb: number }>(
  d
    .object({
      aaa: d.string().optional(),
      bbb: d.number(),
    })
    .required(keys).__output
);
