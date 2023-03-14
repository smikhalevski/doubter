import { expectType } from 'tsd';
import * as d from '../../main';
import { OUTPUT } from '../../main/shapes/Shape';

expectType<111 | 'aaa'>(d.enum([111, 'aaa'])[OUTPUT]);

enum FooEnum {
  AAA,
  BBB,
}

expectType<FooEnum.AAA | FooEnum.BBB>(d.enum(FooEnum)[OUTPUT]);

expectType<'aaa' | 'bbb'>(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const)[OUTPUT]);

expectType<111 | 'aaa' | 333>(d.enum([111, 222, 333]).replace(222, 'aaa')[OUTPUT]);

expectType<111 | 333>(d.enum([111, 222, 333]).deny(222)[OUTPUT]);
