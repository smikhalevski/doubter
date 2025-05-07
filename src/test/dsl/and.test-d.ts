import { expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type OUTPUT } from '../../main/shape/Shape.js';

declare const OUTPUT: OUTPUT;

expectType<{ key1: string } & { key2: number }>(
  d.and([d.object({ key1: d.string() }), d.object({ key2: d.number() })])[OUTPUT]
);

expectType<{ aaa?: string } & { bbb?: number }>(
  d
    .and([
      d.object({
        aaa: d.string(),
      }),
      d.object({
        bbb: d.number(),
      }),
    ])
    .deepPartial()[OUTPUT]
);

expectType<{ aaa?: Array<string | undefined> } & { bbb?: number }>(
  d
    .and([
      d.object({
        aaa: d.array(d.string()),
      }),
      d.object({
        bbb: d.number(),
      }),
    ])
    .deepPartial()[OUTPUT]
);
