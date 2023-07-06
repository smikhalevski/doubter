import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/internal';

expectType<string>(d.string().alter((): 'aaa' => 'aaa')[OUTPUT]);

const x = { param: 111 };

d.string().alter((value, param) => (value === 'aaa' ? 'aaa' : 'bbb'), x);

const stringShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));

expectType<string>(stringShape[INPUT]);

expectType<string>(stringShape[OUTPUT]);

expectType<'bbb'>(stringShape.refine((value): value is 'bbb' => true)[OUTPUT]);

expectType<string>(stringShape.refine((value): value is 'bbb' => true).max(2)[OUTPUT]);

expectType<string>(
  d.string().alter(
    (value, param) => {
      expectType<number>(param);
      return value;
    },
    { param: 111 }
  )[OUTPUT]
);

expectType<'aaa' | 'bbb'>(d.string().refine((value): value is 'aaa' | 'bbb' => true)[OUTPUT]);
