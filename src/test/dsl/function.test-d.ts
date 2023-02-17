import { expectType } from 'tsd';
import * as d from '../../main';

// Alias

expectType<() => any>(d.function().output);

// Arguments

expectType<() => any>(d.fn().output);

expectType<(arg: string) => any>(d.fn([d.string()]).output);

expectType<(arg1: string, arg2: number) => any>(d.fn([d.string(), d.number()]).output);

expectType<(arg: string) => any>(d.fn(d.tuple([d.string()])).output);

expectType<(arg1: string, arg2: number) => any>(d.fn(d.tuple([d.string(), d.number()])).output);

expectType<(arg1: string, arg2: number, ...args: boolean[]) => any>(
  d.fn(d.tuple([d.string(), d.number()]).rest(d.boolean())).output
);

expectType<(...args: any[]) => any>(d.fn(d.array()).output);

expectType<(...args: string[]) => any>(d.fn(d.array(d.string())).output);

expectType<(...args: string[] | [string, number]) => any>(
  d.fn(d.or([d.array(d.string()), d.tuple([d.string(), d.number()])])).output
);

expectType<(arg: string) => any>(d.fn([d.string().transform(parseFloat)]).output);

expectType<(arg: number) => any>(d.fn([d.string().transform(parseFloat)]).input);

expectType<(arg: number) => any>(d.fn([d.string().transform(parseFloat)]).input);

expectType<(arg: string) => any>(d.fn([d.string().transform(parseFloat)]).output);

// Return

expectType<() => string>(d.fn().return(d.string()).output);

expectType<() => Promise<string>>(d.fn().return(d.promise(d.string())).output);

expectType<() => string>(d.fn().return(d.string().transform(parseFloat)).input);

expectType<() => number>(d.fn().return(d.string().transform(parseFloat)).output);

// This

expectType<(this: string) => any>(d.fn().this(d.string()).output);

expectType<(this: number) => any>(d.fn().this(d.string().transform(parseFloat)).input);

expectType<(this: string) => any>(d.fn().this(d.string().transform(parseFloat)).output);
