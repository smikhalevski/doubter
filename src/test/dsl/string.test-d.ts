import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<'aaa'>(d.string().alter((): 'aaa' => 'aaa')[d.OUTPUT]);

const alterShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));

expectType<string>(alterShape[d.INPUT]);

expectType<'aaa' | 'bbb'>(alterShape[d.OUTPUT]);

expectType<'bbb'>(alterShape.refine((value): value is 'bbb' => true).max(2)[d.OUTPUT]);

expectType<'aaa' | 'bbb'>(
  d.string().alter(
    (value, param) => {
      expectType<number>(param);
      return value === 'aaa' ? 'aaa' : 'bbb';
    },
    { param: 111 }
  )[d.OUTPUT]
);

expectType<'aaa' | 'bbb'>(d.string().refine((value): value is 'aaa' | 'bbb' => true)[d.OUTPUT]);
