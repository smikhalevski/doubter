import * as d from 'doubter';
import { expectType } from 'tsd';

// Alias

expectType<() => any>(d.function().__output);

// Arguments

expectType<() => any>(d.fn().__output);

expectType<(arg: string) => any>(d.fn([d.string()]).__output);

expectType<(arg1: string, arg2: number) => any>(d.fn([d.string(), d.number()]).__output);

expectType<(arg: string) => any>(d.fn(d.tuple([d.string()])).__output);

expectType<(arg1: string, arg2: number) => any>(d.fn(d.tuple([d.string(), d.number()])).__output);

expectType<(arg1: string, arg2: number, ...args: boolean[]) => any>(
  d.fn(d.tuple([d.string(), d.number()]).rest(d.boolean())).__output
);

expectType<(...args: any[]) => any>(d.fn(d.array()).__output);

expectType<(...args: string[]) => any>(d.fn(d.array(d.string())).__output);

expectType<(...args: string[] | [string, number]) => any>(
  d.fn(d.or([d.array(d.string()), d.tuple([d.string(), d.number()])])).__output
);

expectType<(arg: string) => any>(d.fn([d.string().transform(parseFloat)]).__output);

expectType<(arg: number) => any>(d.fn([d.string().transform(parseFloat)]).__input);

expectType<(arg: number) => any>(d.fn([d.string().transform(parseFloat)]).__input);

expectType<(arg: string) => any>(d.fn([d.string().transform(parseFloat)]).__output);

// Return

expectType<() => string>(d.fn().return(d.string()).__output);

expectType<() => Promise<string>>(d.fn().return(d.promise(d.string())).__output);

expectType<() => string>(d.fn().return(d.string().transform(parseFloat)).__input);

expectType<() => number>(d.fn().return(d.string().transform(parseFloat)).__output);

// This

expectType<(this: string) => any>(d.fn().this(d.string()).__output);

expectType<(this: number) => any>(d.fn().this(d.string().transform(parseFloat)).__input);

expectType<(this: string) => any>(d.fn().this(d.string().transform(parseFloat)).__output);
