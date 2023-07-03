import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<number | string>(d.or([d.number(), d.string()])[_OUTPUT]);

expectType<{ key1: string } | { key2: number }>(
  d.or([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[_OUTPUT]
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
    .deepPartial()[_OUTPUT]
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
    .deepPartial()[_OUTPUT]
);
