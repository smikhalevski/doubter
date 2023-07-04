import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal';

expectType<Map<string, number>>(d.map(d.string(), d.number())[OUTPUT]);

expectType<Map<'bbb', number>>(
  d.map(
    d.string().convert((): 'bbb' => 'bbb'),
    d.number()
  )[OUTPUT]
);

expectType<Map<string, number | undefined>>(d.map(d.string(), d.number()).deepPartial()[OUTPUT]);

expectType<Map<{ aaa?: string }, { bbb?: number } | undefined>>(
  d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial()[OUTPUT]
);
