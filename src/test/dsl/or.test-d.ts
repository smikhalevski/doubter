import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<number | string>(d.or([d.number(), d.string()]).__output);

expectType<{ key1: string } | { key2: number }>(
  d.or([d.object({ key1: d.string() }), d.object({ key2: d.number() })]).__output
);

expectType<{ aaa?: string } | { bbb?: number }>(
  d
    .or([
      d.object({
        aaa: d.string(),
      }),
      d.object({
        bbb: d.number(),
      }),
    ])
    .deepPartial().__output
);

expectType<{ aaa?: Array<string | undefined> } | { bbb?: number }>(
  d
    .or([
      d.object({
        aaa: d.array(d.string()),
      }),
      d.object({
        bbb: d.number(),
      }),
    ])
    .deepPartial().__output
);
