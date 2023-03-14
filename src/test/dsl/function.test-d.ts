import { expectType } from 'tsd';
import * as d from '../../main';
import { INPUT, OUTPUT } from '../../main/shapes/Shape';

// Alias

expectType<() => any>(d.function()[OUTPUT]);

// Arguments

expectType<() => any>(d.fn()[OUTPUT]);

expectType<(arg: string) => any>(d.fn([d.string()])[OUTPUT]);

expectType<(arg1: string, arg2: number) => any>(d.fn([d.string(), d.number()])[OUTPUT]);

expectType<(arg: string) => any>(d.fn(d.tuple([d.string()]))[OUTPUT]);

expectType<(arg1: string, arg2: number) => any>(d.fn(d.tuple([d.string(), d.number()]))[OUTPUT]);

expectType<(arg1: string, arg2: number, ...args: boolean[]) => any>(
  d.fn(d.tuple([d.string(), d.number()]).rest(d.boolean()))[OUTPUT]
);

expectType<(...args: any[]) => any>(d.fn(d.array())[OUTPUT]);

expectType<(...args: string[]) => any>(d.fn(d.array(d.string()))[OUTPUT]);

expectType<(...args: string[] | [string, number]) => any>(
  d.fn(d.or([d.array(d.string()), d.tuple([d.string(), d.number()])]))[OUTPUT]
);

expectType<(arg: string) => any>(d.fn([d.string().transform(parseFloat)])[OUTPUT]);

expectType<(arg: number) => any>(d.fn([d.string().transform(parseFloat)])[INPUT]);

expectType<(arg: number) => any>(d.fn([d.string().transform(parseFloat)])[INPUT]);

expectType<(arg: string) => any>(d.fn([d.string().transform(parseFloat)])[OUTPUT]);

// Return

expectType<() => string>(d.fn().return(d.string())[OUTPUT]);

expectType<() => Promise<string>>(d.fn().return(d.promise(d.string()))[OUTPUT]);

expectType<() => string>(d.fn().return(d.string().transform(parseFloat))[INPUT]);

expectType<() => number>(d.fn().return(d.string().transform(parseFloat))[OUTPUT]);

// This

expectType<(this: string) => any>(d.fn().this(d.string())[OUTPUT]);

expectType<(this: number) => any>(d.fn().this(d.string().transform(parseFloat))[INPUT]);

expectType<(this: string) => any>(d.fn().this(d.string().transform(parseFloat))[OUTPUT]);
