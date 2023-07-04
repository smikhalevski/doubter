import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal';

expectType<any[]>(d.array()[INPUT]);

expectType<any[]>(d.array()[OUTPUT]);

expectType<111[]>(d.array(d.const(111))[INPUT]);

expectType<111[]>(d.array(d.const(111))[OUTPUT]);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial()[OUTPUT]);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial()[OUTPUT]);

// const a = d
//   .array(d.string().refine((value): value is 'aaa' | 'bbb' => true))
//   .refine((value): value is ['aaa'] => true)
//   .min(3)[OUTPUT];
