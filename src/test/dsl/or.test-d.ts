import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<number | string>(d.or([d.number(), d.string()]).output);

expectType<{ key1: string } | { key2: number }>(
  d.or([d.object({ key1: d.string() }), d.object({ key2: d.number() })]).output
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
    .deepPartial().output
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
    .deepPartial().output
);
