import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shape/Shape';

expectType<string>(d.string().alter((): 'aaa' => 'aaa')[OUTPUT]);

const x = { param: 111 };

d.string().alter((value, param) => (value === 'aaa' ? 'aaa' : 'bbb'), x);

// const alterShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));
//
// expectType<string>(alterShape[INPUT]);
//
// expectType<'aaa' | 'bbb'>(alterShape[OUTPUT]);
//
// expectType<'bbb'>(alterShape.refine((value): value is 'bbb' => true).max(2)[OUTPUT]);
//
// expectType<'aaa' | 'bbb'>(
//   d.string().alter(
//     (value, param) => {
//       expectType<number>(param);
//       return value === 'aaa' ? 'aaa' : 'bbb';
//     },
//     { param: 111 }
//   )[OUTPUT]
// );
//
// expectType<'aaa' | 'bbb'>(d.string().refine((value): value is 'aaa' | 'bbb' => true)[OUTPUT]);
