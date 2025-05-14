import { expectType } from 'tsd';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

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

d.record(d.number()).notAllKeys(['bbb']);

expectType<{ [key: string]: number }>(d.record(d.number()).readonly()[INPUT]);

expectType<{ readonly [key: string]: number }>(d.record(d.number()).readonly()[OUTPUT]);
