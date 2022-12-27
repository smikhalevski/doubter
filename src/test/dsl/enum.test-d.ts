import { expectType } from 'tsd';
import * as d from '../../main';

expectType<111 | 'aaa'>(d.enum([111, 'aaa']).parse(null));

enum FooEnum {
  AAA,
  BBB,
}

expectType<FooEnum.AAA | FooEnum.BBB>(d.enum(FooEnum).parse(null));

expectType<'aaa' | 'bbb'>(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const).parse(null));
