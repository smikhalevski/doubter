import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Map<string, number>>(d.map(d.string(), d.number())[d.OUTPUT]);

expectType<Map<'bbb', number>>(
  d.map(
    d.string().convert((): 'bbb' => 'bbb'),
    d.number()
  )[d.OUTPUT]
);

expectType<Map<string, number | undefined>>(d.map(d.string(), d.number()).deepPartial()[d.OUTPUT]);

expectType<Map<{ aaa?: string }, { bbb?: number } | undefined>>(
  d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial()[d.OUTPUT]
);
