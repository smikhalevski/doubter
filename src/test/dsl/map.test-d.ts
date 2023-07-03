import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<Map<string, number>>(d.map(d.string(), d.number())[_OUTPUT]);

expectType<Map<'bbb', number>>(
  d.map(
    d.string().convert((): 'bbb' => 'bbb'),
    d.number()
  )[_OUTPUT]
);

expectType<Map<string, number | undefined>>(d.map(d.string(), d.number()).deepPartial()[_OUTPUT]);

expectType<Map<{ aaa?: string }, { bbb?: number } | undefined>>(
  d.map(d.object({ aaa: d.string() }), d.object({ bbb: d.number() })).deepPartial()[_OUTPUT]
);
