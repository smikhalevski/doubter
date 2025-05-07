import { expectNotType, expectType } from 'tsd';
import * as d from '../../main/index.ts';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.ts';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

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

expectType<(arg: string) => any>(d.fn([d.string().convert(parseFloat)])[OUTPUT]);

expectType<(arg: number) => any>(d.fn([d.string().convert(parseFloat)])[INPUT]);

expectType<(arg: number) => any>(d.fn([d.string().convert(parseFloat)])[INPUT]);

expectType<(arg: string) => any>(d.fn([d.string().convert(parseFloat)])[OUTPUT]);

// Return

expectType<() => string>(d.fn().return(d.string())[OUTPUT]);

expectType<() => Promise<string>>(d.fn().return(d.promise(d.string()))[OUTPUT]);

expectType<() => string>(d.fn().return(d.string().convert(parseFloat))[INPUT]);

expectType<() => number>(d.fn().return(d.string().convert(parseFloat))[OUTPUT]);

// This

expectType<(this: string) => any>(d.fn().this(d.string())[OUTPUT]);

expectType<(this: number) => any>(d.fn().this(d.string().convert(parseFloat))[INPUT]);

expectType<(this: string) => any>(d.fn().this(d.string().convert(parseFloat))[OUTPUT]);

// ensure

expectType<(this: number, arg: boolean) => boolean>(
  d
    .fn([d.boolean().convert(() => 111)])
    .this(d.number().convert(() => 'aaa'))
    .return(d.string().convert(() => true))
    .ensure(function (arg) {
      expectType<string>(this);
      expectType<number>(arg);

      return 'aaa';
    })
);

// arg2 is excessive
expectNotType<(this: number, arg1: boolean, arg2: unknown) => string>(
  d
    .fn([d.boolean()])
    .this(d.number())
    .return(d.string())
    .ensure(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => string>(
  d
    .fn([d.boolean()])
    .this(d.number())
    .return(d.string())
    .ensure(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => string>(
  d
    .fn()
    .this(d.number())
    .return(d.string())
    .ensure(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => string>(
  d
    .fn()
    .return(d.string())
    .ensure(function (this: number) {
      return 'aaa';
    })
);

expectType<(this: number) => string>(
  d.fn().ensure(function (this: number) {
    return 'aaa';
  })
);

expectType<() => number>(d.fn().ensure(() => 111));

// ensureAsync

expectType<() => Promise<string>>(
  d
    .fn()
    .return(d.promise(d.string()))
    .ensureAsync(async function () {
      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<boolean>>(
  d
    .fn([d.boolean().convert(() => 111)])
    .this(d.number().convert(() => 'aaa'))
    .return(d.string().convert(() => true))
    .ensureAsync(function (arg) {
      expectType<string>(this);
      expectType<number>(arg);

      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<boolean>>(
  d
    .fn([d.boolean().convert(() => 111)])
    .this(d.number().convert(() => 'aaa'))
    .return(d.string().convert(() => true))
    .ensureAsync(async function (arg) {
      expectType<string>(this);
      expectType<number>(arg);

      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<boolean>>(
  d
    .fn([d.boolean().convertAsync(() => Promise.resolve(111))])
    .this(d.number().convert(() => 'aaa'))
    .return(d.string().convert(() => true))
    .ensureAsync(function (arg) {
      expectType<string>(this);
      expectType<number>(arg);

      return 'aaa';
    })
);

// arg2 is excessive
expectNotType<(this: number, arg1: boolean, arg2: unknown) => Promise<string>>(
  d
    .fn([d.boolean()])
    .this(d.number())
    .return(d.string())
    .ensureAsync(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<string>>(
  d
    .fn([d.boolean()])
    .this(d.number())
    .return(d.string())
    .ensureAsync(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d
    .fn()
    .this(d.number())
    .return(d.string())
    .ensureAsync(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d
    .fn()
    .return(d.string())
    .ensureAsync(function (this: number) {
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d
    .fn()
    .return(d.promise(d.string()))
    .ensureAsync(async function (this: number) {
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d.fn().ensureAsync(function (this: number) {
    return 'aaa';
  })
);

expectType<() => Promise<string>>(
  d.fn().ensureAsync(async function () {
    return 'aaa';
  })
);

expectType<() => Promise<number>>(d.fn().ensureAsync(() => 111));
