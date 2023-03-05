import * as d from 'doubter';
import { expectType } from 'tsd';

expectType<111 | 'aaa'>(d.enum([111, 'aaa']).output);

enum FooEnum {
  AAA,
  BBB,
}

expectType<FooEnum.AAA | FooEnum.BBB>(d.enum(FooEnum).output);

expectType<'aaa' | 'bbb'>(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const).output);

expectType<111 | 'aaa' | 333>(d.enum([111, 222, 333]).replace(222, 'aaa').output);

expectType<111 | 333>(d.enum([111, 222, 333]).deny(222).output);
