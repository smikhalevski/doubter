import { expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.ts';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

expectType<111 | 'aaa'>(d.enum([111, 'aaa'])[OUTPUT]);

enum FooEnum {
  AAA,
  BBB,
}

expectType<FooEnum.AAA | FooEnum.BBB>(d.enum(FooEnum)[OUTPUT]);

expectType<'aaa' | 'bbb'>(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const)[OUTPUT]);

expectType<111 | 'aaa' | 333>(d.enum([111, 222, 333]).replace(222, 'aaa')[OUTPUT]);

expectType<number>(d.enum([33, 42]).replace(NaN, 0)[INPUT]);

expectType<33 | 42 | 0>(d.enum([33, 42]).replace(NaN, 0)[OUTPUT]);

expectType<111 | 333>(d.enum([111, 222, 333]).deny(222)[OUTPUT]);

expectType<222>(d.enum([111, 222, 333]).refine((_value): _value is 222 => true)[OUTPUT]);

const enumValues = [111, 'aaa'] as const;

expectType<111 | 'aaa'>(d.enum(enumValues)[INPUT]);

expectType<111 | 'aaa'>(d.enum(enumValues)[OUTPUT]);
