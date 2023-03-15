import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<Map<string, number>>(d.map(d.string(), d.number()).__output);

expectType<Map<'bbb', number>>(
  d.map(
    d.string().transform((): 'bbb' => 'bbb'),
    d.number()
  ).__output
);

expectType<Map<string, number | undefined>>(d.map(d.string(), d.number()).deepPartial().__output);

expectType<Map<{ aaa?: string }, { bbb?: number } | undefined>>(
  d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial().__output
);
