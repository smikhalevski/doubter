import { expectNotAssignable, expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal/shapes';

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

expectType<Map<string, string>>(d.map(d.string(), d.string()).readonly()[INPUT]);

expectNotAssignable<Map<string, string>>(d.map(d.string(), d.string()).readonly()[OUTPUT]);

expectType<ReadonlyMap<string, string>>(d.map(d.string(), d.string()).readonly()[OUTPUT]);
