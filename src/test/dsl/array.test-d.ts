import { expectType } from 'tsd';
import * as d from '../../main';
import { _INPUT, _OUTPUT } from '../../main/shape/Shape';

expectType<any[]>(d.array()[_INPUT]);

expectType<any[]>(d.array()[_OUTPUT]);

expectType<111[]>(d.array(d.const(111))[_INPUT]);

expectType<111[]>(d.array(d.const(111))[_OUTPUT]);

expectType<Array<number | undefined>>(d.array(d.number()).deepPartial()[_OUTPUT]);

expectType<Array<{ aaa?: number } | undefined>>(d.array(d.object({ aaa: d.number() })).deepPartial()[_OUTPUT]);

// const a = d
//   .array(d.string().refine((value): value is 'aaa' | 'bbb' => true))
//   .refine((value): value is ['aaa'] => true)
//   .min(3)[_OUTPUT];
