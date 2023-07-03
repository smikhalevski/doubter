import { expectType } from 'tsd';
import * as d from '../../main';
import { _OUTPUT } from '../../main/shape/Shape';

expectType<111 | 'aaa'>(d.enum([111, 'aaa'])[_OUTPUT]);

enum FooEnum {
  AAA,
  BBB,
}

expectType<FooEnum.AAA | FooEnum.BBB>(d.enum(FooEnum)[_OUTPUT]);

expectType<'aaa' | 'bbb'>(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const)[_OUTPUT]);

expectType<111 | 'aaa' | 333>(d.enum([111, 222, 333]).replace(222, 'aaa')[_OUTPUT]);

expectType<111 | 333>(d.enum([111, 222, 333]).deny(222)[_OUTPUT]);

expectType<222>(d.enum([111, 222, 333]).refine((value): value is 222 => true)[_OUTPUT]);
