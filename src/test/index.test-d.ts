import { expectType } from 'tsd';
import * as d from '../main';

expectType<111>(d.any((value): value is 111 => true).parse(null));

expectType<111[]>(d.array(d.const(111)).parse(null));

expectType<111>(d.const(111).parse(null));

expectType<111 | 'aaa'>(d.enum([111, 'aaa']).parse(null));

enum FooEnum {
  AAA,
  BBB,
}

expectType<FooEnum.AAA | FooEnum.BBB>(d.enum(FooEnum).parse(null));

expectType<'aaa' | 'bbb'>(d.enum({ AAA: 'aaa', BBB: 'bbb' } as const).parse(null));

class FooClass {
  aaa = 111;
}

expectType<FooClass>(d.instanceOf(FooClass).parse(null));

expectType<{ foo: string } & { bar: number }>(
  d.intersection([d.object({ foo: d.string() }), d.object({ bar: d.number() })]).parse(null)
);

expectType<number>(d.lazy(() => d.string().transform(parseFloat)).parse(null));

expectType<number | string>(d.or([d.number(), d.string()]).parse(null));

expectType<Promise<Promise<string>>>(d.promise(d.string()).parseAsync(Promise.resolve('aaa')));

expectType<Record<string, number>>(d.record(d.number()).parse(null));

expectType<{ bbb: number }>(
  d
    .record(
      d.string().transform((): 'bbb' => 'bbb'),
      d.number()
    )
    .parse(null)
);

expectType<[string, number]>(d.tuple([d.string(), d.number()]).parse(null));

expectType<[string, number, ...boolean[]]>(d.tuple([d.string(), d.number()], d.boolean()).parse(null));

expectType<{ foo: string } | { foo: number }>(
  d.union([d.object({ foo: d.string() }), d.object({ foo: d.number() })]).parse(null)
);
