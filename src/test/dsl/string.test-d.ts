import { expectType } from 'tsd';
import * as d from '../../main';
import { _INPUT, _OUTPUT } from '../../main/shape/Shape';

expectType<'aaa'>(d.string().alter((): 'aaa' => 'aaa')[_OUTPUT]);

const x = { param: 111 };

d.string().alter((value, param) => (value === 'aaa' ? 'aaa' : 'bbb'), x);

// const alterShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));
//
// expectType<string>(alterShape[_INPUT]);
//
// expectType<'aaa' | 'bbb'>(alterShape[_OUTPUT]);
//
// expectType<'bbb'>(alterShape.refine((value): value is 'bbb' => true).max(2)[_OUTPUT]);
//
// expectType<'aaa' | 'bbb'>(
//   d.string().alter(
//     (value, param) => {
//       expectType<number>(param);
//       return value === 'aaa' ? 'aaa' : 'bbb';
//     },
//     { param: 111 }
//   )[_OUTPUT]
// );
//
// expectType<'aaa' | 'bbb'>(d.string().refine((value): value is 'aaa' | 'bbb' => true)[_OUTPUT]);
