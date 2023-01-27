import { expectType } from 'tsd';
import * as d from 'doubter';

expectType<
  <R, T = any>(callback: (this: T, arg0: string, arg1: boolean) => R) => (this: T, arg0: string, arg1: boolean) => R
>(d.guard([d.string(), d.boolean()]));

expectType<
  <R, T = any>(callback: (this: T, arg0: string, arg1: boolean) => R) => (this: T, arg0: string, arg1: boolean) => R
>(d.guard(d.tuple([d.string(), d.boolean()])));

expectType<<R, T = any>(callback: (this: T, arg: string) => R) => (this: T, arg: string) => R>(d.guard(d.string()));

expectType<(this: number, arg0: string, arg1: boolean) => symbol>(
  d.guard([d.string(), d.boolean()], function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: [string, boolean]) => symbol>(
  d.guard(d.tuple([d.string(), d.boolean()]), function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: string) => symbol>(
  d.guard(d.string(), function (this: number) {
    return Symbol();
  })
);

expectType<
  <R, T = any>(
    callback: (this: T, arg0: string, arg1: boolean) => Promise<R> | R
  ) => (this: T, arg0: string, arg1: boolean) => Promise<R>
>(d.guardAsync([d.string(), d.boolean()]));

expectType<
  <R, T = any>(
    callback: (this: T, arg0: string, arg1: boolean) => Promise<R> | R
  ) => (this: T, arg0: string, arg1: boolean) => Promise<R>
>(d.guardAsync(d.tuple([d.string(), d.boolean()])));

expectType<<R, T = any>(callback: (this: T, arg: string) => Promise<R> | R) => (this: T, arg: string) => Promise<R>>(
  d.guardAsync(d.string())
);

expectType<(this: number, arg0: string, arg1: boolean) => Promise<symbol>>(
  d.guardAsync([d.string(), d.boolean()], function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: [string, boolean]) => Promise<symbol>>(
  d.guardAsync(d.tuple([d.string(), d.boolean()]), function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: string) => Promise<symbol>>(
  d.guardAsync(d.string(), function (this: number) {
    return Symbol();
  })
);
