import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/internal/shapes';

expectType<Record<string, number>>(d.record(d.number())[OUTPUT]);

expectType<{ bbb: number }>(
  d.record(
    d.string().convert((): 'bbb' => 'bbb'),
    d.number()
  )[OUTPUT]
);

expectType<Record<string, boolean | undefined>>(d.record(d.string(), d.boolean().optional())[OUTPUT]);

d.record(d.number()).notAllKeys(['bbb']);

d.record(d.enum(['aaa', 'bbb']), d.number()).notAllKeys(['bbb']);

d.record(
  d.string().convert(x => x as 'aaa' | 'bbb'),
  d.number()
).notAllKeys(['bbb']);
