import { expectType } from 'tsd';
import * as d from '../main';

expectType<
  <R, T = any>(callback: (this: T, arg0: string, arg1: boolean) => R) => (this: T, arg0: string, arg1: boolean) => R
>(d.fn([d.string(), d.boolean()]));

expectType<
  <R, T = any>(callback: (this: T, arg0: string, arg1: boolean) => R) => (this: T, arg0: string, arg1: boolean) => R
>(d.fn(d.tuple([d.string(), d.boolean()])));

expectType<<R, T = any>(callback: (this: T, arg: string) => R) => (this: T, arg: string) => R>(d.fn(d.string()));

expectType<(this: number, arg0: string, arg1: boolean) => symbol>(
  d.fn([d.string(), d.boolean()], function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: [string, boolean]) => symbol>(
  d.fn(d.tuple([d.string(), d.boolean()]), function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: string) => symbol>(
  d.fn(d.string(), function (this: number) {
    return Symbol();
  })
);

expectType<
  <R, T = any>(
    callback: (this: T, arg0: string, arg1: boolean) => Promise<R> | R
  ) => (this: T, arg0: string, arg1: boolean) => Promise<R>
>(d.fnAsync([d.string(), d.boolean()]));

expectType<
  <R, T = any>(
    callback: (this: T, arg0: string, arg1: boolean) => Promise<R> | R
  ) => (this: T, arg0: string, arg1: boolean) => Promise<R>
>(d.fnAsync(d.tuple([d.string(), d.boolean()])));

expectType<<R, T = any>(callback: (this: T, arg: string) => Promise<R> | R) => (this: T, arg: string) => Promise<R>>(
  d.fnAsync(d.string())
);

expectType<(this: number, arg0: string, arg1: boolean) => Promise<symbol>>(
  d.fnAsync([d.string(), d.boolean()], function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: [string, boolean]) => Promise<symbol>>(
  d.fnAsync(d.tuple([d.string(), d.boolean()]), function (this: number) {
    return Symbol();
  })
);

expectType<(this: number, arg: string) => Promise<symbol>>(
  d.fnAsync(d.string(), function (this: number) {
    return Symbol();
  })
);
