import { expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.ts';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<string>(d.string().alter((): 'aaa' => 'aaa')[OUTPUT]);

const x = { param: 111 };

d.string().alter((value, _param) => (value === 'aaa' ? 'aaa' : 'bbb'), x);

const stringShape = d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'));

expectType<string>(stringShape[INPUT]);

expectType<string>(stringShape[OUTPUT]);

expectType<'bbb'>(stringShape.refine((_value): _value is 'bbb' => true)[OUTPUT]);

expectType<string>(stringShape.refine((_value): _value is 'bbb' => true).max(2)[OUTPUT]);

expectType<string>(
  d.string().alter(
    (value, param) => {
      expectType<number>(param);
      return value;
    },
    { param: 111 }
  )[OUTPUT]
);

expectType<'aaa' | 'bbb'>(d.string().refine((_value): _value is 'aaa' | 'bbb' => true)[OUTPUT]);
