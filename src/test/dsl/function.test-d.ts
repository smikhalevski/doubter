import * as d from 'doubter';
import { INPUT, OUTPUT } from 'doubter';
import { expectNotType, expectType } from 'tsd';

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

// ensureSignature

expectType<(this: number, arg: boolean) => boolean>(
  d
    .fn([d.boolean().transform(() => 111)])
    .this(d.number().transform(() => 'aaa'))
    .return(d.string().transform(() => true))
    .ensureSignature(function (arg) {
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
    .ensureSignature(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => string>(
  d
    .fn([d.boolean()])
    .this(d.number())
    .return(d.string())
    .ensureSignature(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => string>(
  d
    .fn()
    .this(d.number())
    .return(d.string())
    .ensureSignature(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => string>(
  d
    .fn()
    .return(d.string())
    .ensureSignature(function (this: number) {
      return 'aaa';
    })
);

expectType<(this: number) => string>(
  d.fn().ensureSignature(function (this: number) {
    return 'aaa';
  })
);

expectType<() => number>(d.fn().ensureSignature(() => 111));

// ensureAsyncSignature

expectType<() => Promise<string>>(
  d
    .fn()
    .return(d.promise(d.string()))
    .ensureAsyncSignature(async function () {
      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<boolean>>(
  d
    .fn([d.boolean().transform(() => 111)])
    .this(d.number().transform(() => 'aaa'))
    .return(d.string().transform(() => true))
    .ensureAsyncSignature(function (arg) {
      expectType<string>(this);
      expectType<number>(arg);

      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<boolean>>(
  d
    .fn([d.boolean().transform(() => 111)])
    .this(d.number().transform(() => 'aaa'))
    .return(d.string().transform(() => true))
    .ensureAsyncSignature(async function (arg) {
      expectType<string>(this);
      expectType<number>(arg);

      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<boolean>>(
  d
    .fn([d.boolean().transformAsync(() => Promise.resolve(111))])
    .this(d.number().transform(() => 'aaa'))
    .return(d.string().transform(() => true))
    .ensureAsyncSignature(function (arg) {
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
    .ensureAsyncSignature(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number, arg: boolean) => Promise<string>>(
  d
    .fn([d.boolean()])
    .this(d.number())
    .return(d.string())
    .ensureAsyncSignature(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d
    .fn()
    .this(d.number())
    .return(d.string())
    .ensureAsyncSignature(function () {
      expectType<number>(this);
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d
    .fn()
    .return(d.string())
    .ensureAsyncSignature(function (this: number) {
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d
    .fn()
    .return(d.promise(d.string()))
    .ensureAsyncSignature(async function (this: number) {
      return 'aaa';
    })
);

expectType<(this: number) => Promise<string>>(
  d.fn().ensureAsyncSignature(function (this: number) {
    return 'aaa';
  })
);

expectType<() => Promise<string>>(
  d.fn().ensureAsyncSignature(async function () {
    return 'aaa';
  })
);

expectType<() => Promise<number>>(d.fn().ensureAsyncSignature(() => 111));
