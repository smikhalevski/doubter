import * as d from 'doubter';
import { OUTPUT } from 'doubter';
import { expectType } from 'tsd';

expectType<'aaa'>(d.string().alter((): 'aaa' => 'aaa')[OUTPUT]);

expectType<d.StringShape<'aaa' | 'bbb'>>(d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb')));

expectType<d.StringShape<'aaa' | 'bbb'>>(d.string().alter(value => (value === 'aaa' ? 'aaa' : 'bbb'), { param: 111 }));

expectType<d.StringShape<'aaa' | 'bbb'>>(d.string().refine((value): value is 'aaa' | 'bbb' => true));
