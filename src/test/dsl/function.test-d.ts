import { expectType } from 'tsd';
import * as d from '../../main';

expectType<() => string>(d.fn().return(d.string()).output);

expectType<(arg: string) => string>(d.fn([d.string()]).return(d.string()).output);

expectType<(arg1: string, arg2: number) => string>(d.fn([d.string(), d.number()]).return(d.string()).output);

expectType<(...args: any[]) => string>(d.fn(d.array()).return(d.string()).output);

expectType<(...args: number[]) => string>(d.fn(d.array(d.number())).return(d.string()).output);

expectType<(arg1: string, arg2: number) => string>(d.fn(d.tuple([d.string(), d.number()])).return(d.string()).output);

expectType<() => string>(
  d
    .fn()
    .return(d.string())
    .parse(() => '')
);

expectType<() => Promise<string>>(
  d
    .fn()
    .return(d.string())
    .decorateAsync(() => '')
);

expectType<() => Promise<string>>(
  d
    .fn()
    .return(d.string())
    .decorateAsync(() => Promise.resolve(''))
);

d.fn().this(d.object({ foo: d.string() }));
