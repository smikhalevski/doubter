import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<Map<string, number>>(d.map(d.string(), d.number()).output);

expectType<Map<'bbb', number>>(
  d.map(
    d.string().transform((): 'bbb' => 'bbb'),
    d.number()
  ).output
);

expectType<Map<string, number | undefined>>(d.map(d.string(), d.number()).deepPartial().output);

expectType<Map<{ aaa?: string }, { bbb?: number } | undefined>>(
  d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial().output
);
