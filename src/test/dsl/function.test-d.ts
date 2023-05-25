import * as d from 'doubter';
import { expectNotType, expectType } from 'tsd';

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
