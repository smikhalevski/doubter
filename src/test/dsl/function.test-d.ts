import { expectTypeOf, test } from 'vitest';
import * as d from '../../main/index.js';
import { type INPUT, type OUTPUT } from '../../main/shape/Shape.js';

declare const INPUT: INPUT;
declare const OUTPUT: OUTPUT;

test('alias', () => {
  expectTypeOf(d.function()[OUTPUT]).toEqualTypeOf<() => any>();
});

test('arguments', () => {
  expectTypeOf(d.fn()[OUTPUT]).toEqualTypeOf<() => any>();

  expectTypeOf(d.fn([d.string()])[OUTPUT]).toEqualTypeOf<(arg: string) => any>();

  expectTypeOf(d.fn([d.string(), d.number()])[OUTPUT]).toEqualTypeOf<(arg1: string, arg2: number) => any>();

  expectTypeOf(d.fn(d.tuple([d.string()]))[OUTPUT]).toEqualTypeOf<(arg: string) => any>();

  expectTypeOf(d.fn(d.tuple([d.string(), d.number()]))[OUTPUT]).toEqualTypeOf<(arg1: string, arg2: number) => any>();

  expectTypeOf(d.fn(d.tuple([d.string(), d.number()]).rest(d.boolean()))[OUTPUT]).toEqualTypeOf<
    (arg1: string, arg2: number, ...args: boolean[]) => any
  >();

  expectTypeOf(d.fn(d.array())[OUTPUT]).toEqualTypeOf<(...args: any[]) => any>();

  expectTypeOf(d.fn(d.array(d.string()))[OUTPUT]).toEqualTypeOf<(...args: string[]) => any>();

  expectTypeOf(d.fn(d.or([d.array(d.string()), d.tuple([d.string(), d.number()])]))[OUTPUT]).toEqualTypeOf<
    (...args: string[] | [string, number]) => any
  >();

  expectTypeOf(d.fn([d.string().convert(parseFloat)])[OUTPUT]).toEqualTypeOf<(arg: string) => any>();

  expectTypeOf(d.fn([d.string().convert(parseFloat)])[INPUT]).toEqualTypeOf<(arg: number) => any>();

  expectTypeOf(d.fn([d.string().convert(parseFloat)])[INPUT]).toEqualTypeOf<(arg: number) => any>();

  expectTypeOf(d.fn([d.string().convert(parseFloat)])[OUTPUT]).toEqualTypeOf<(arg: string) => any>();
});

test('return', () => {
  expectTypeOf(d.fn().return(d.string())[OUTPUT]).toEqualTypeOf<() => string>();

  expectTypeOf(d.fn().return(d.promise(d.string()))[OUTPUT]).toEqualTypeOf<() => Promise<string>>();

  expectTypeOf(d.fn().return(d.string().convert(parseFloat))[INPUT]).toEqualTypeOf<() => string>();

  expectTypeOf(d.fn().return(d.string().convert(parseFloat))[OUTPUT]).toEqualTypeOf<() => number>();
});

test('this', () => {
  expectTypeOf(d.fn().this(d.string())[OUTPUT]).toEqualTypeOf<(this: string) => any>();

  expectTypeOf(d.fn().this(d.string().convert(parseFloat))[INPUT]).toEqualTypeOf<(this: number) => any>();

  expectTypeOf(d.fn().this(d.string().convert(parseFloat))[OUTPUT]).toEqualTypeOf<(this: string) => any>();
});

test('ensure', () => {
  expectTypeOf(
    d
      .fn([d.boolean().convert(() => 111)])
      .this(d.number().convert(() => 'aaa'))
      .return(d.string().convert(() => true))
      .ensure(function (arg) {
        expectTypeOf(this).toEqualTypeOf<string>();
        expectTypeOf(arg).toEqualTypeOf<number>();

        return 'aaa';
      })
  ).toEqualTypeOf<(this: number, arg: boolean) => boolean>();

  // arg2 is excessive
  expectTypeOf(
    d
      .fn([d.boolean()])
      .this(d.number())
      .return(d.string())
      .ensure(function () {
        expectTypeOf(this).toEqualTypeOf<number>();
        return 'aaa';
      })
  ).not.toEqualTypeOf<(this: number, arg1: boolean, arg2: unknown) => string>();

  expectTypeOf(
    d
      .fn([d.boolean()])
      .this(d.number())
      .return(d.string())
      .ensure(function () {
        expectTypeOf(this).toEqualTypeOf<number>();
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number, arg: boolean) => string>();

  expectTypeOf(
    d
      .fn()
      .this(d.number())
      .return(d.string())
      .ensure(function () {
        expectTypeOf(this).toEqualTypeOf<number>();
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number) => string>();

  expectTypeOf(
    d
      .fn()
      .return(d.string())
      .ensure(function (this: number) {
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number) => string>();

  expectTypeOf(
    d.fn().ensure(function (this: number) {
      return 'aaa';
    })
  ).toEqualTypeOf<(this: number) => string>();

  expectTypeOf(d.fn().ensure(() => 111)).toEqualTypeOf<() => number>();
});

test('ensureasync', () => {
  expectTypeOf(
    d
      .fn()
      .return(d.promise(d.string()))
      .ensureAsync(async function () {
        return 'aaa';
      })
  ).toEqualTypeOf<() => Promise<string>>();

  expectTypeOf(
    d
      .fn([d.boolean().convert(() => 111)])
      .this(d.number().convert(() => 'aaa'))
      .return(d.string().convert(() => true))
      .ensureAsync(function (arg) {
        expectTypeOf(this).toEqualTypeOf<string>();
        expectTypeOf(arg).toEqualTypeOf<number>();

        return 'aaa';
      })
  ).toEqualTypeOf<(this: number, arg: boolean) => Promise<boolean>>();

  expectTypeOf(
    d
      .fn([d.boolean().convert(() => 111)])
      .this(d.number().convert(() => 'aaa'))
      .return(d.string().convert(() => true))
      .ensureAsync(async function (arg) {
        expectTypeOf(this).toEqualTypeOf<string>();
        expectTypeOf(arg).toEqualTypeOf<number>();

        return 'aaa';
      })
  ).toEqualTypeOf<(this: number, arg: boolean) => Promise<boolean>>();

  expectTypeOf(
    d
      .fn([d.boolean().convertAsync(() => Promise.resolve(111))])
      .this(d.number().convert(() => 'aaa'))
      .return(d.string().convert(() => true))
      .ensureAsync(function (arg) {
        expectTypeOf(this).toEqualTypeOf<string>();
        expectTypeOf(arg).toEqualTypeOf<number>();

        return 'aaa';
      })
  ).toEqualTypeOf<(this: number, arg: boolean) => Promise<boolean>>();

  // arg2 is excessive
  expectTypeOf(
    d
      .fn([d.boolean()])
      .this(d.number())
      .return(d.string())
      .ensureAsync(function () {
        expectTypeOf(this).toEqualTypeOf<number>();
        return 'aaa';
      })
  ).not.toEqualTypeOf<(this: number, arg1: boolean, arg2: unknown) => Promise<string>>();

  expectTypeOf(
    d
      .fn([d.boolean()])
      .this(d.number())
      .return(d.string())
      .ensureAsync(function () {
        expectTypeOf(this).toEqualTypeOf<number>();
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number, arg: boolean) => Promise<string>>();

  expectTypeOf(
    d
      .fn()
      .this(d.number())
      .return(d.string())
      .ensureAsync(function () {
        expectTypeOf(this).toEqualTypeOf<number>();
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number) => Promise<string>>();

  expectTypeOf(
    d
      .fn()
      .return(d.string())
      .ensureAsync(function (this: number) {
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number) => Promise<string>>();

  expectTypeOf(
    d
      .fn()
      .return(d.promise(d.string()))
      .ensureAsync(async function (this: number) {
        return 'aaa';
      })
  ).toEqualTypeOf<(this: number) => Promise<string>>();

  expectTypeOf(
    d.fn().ensureAsync(function (this: number) {
      return 'aaa';
    })
  ).toEqualTypeOf<(this: number) => Promise<string>>();

  expectTypeOf(
    d.fn().ensureAsync(async function () {
      return 'aaa';
    })
  ).toEqualTypeOf<() => Promise<string>>();

  expectTypeOf(d.fn().ensureAsync(() => 111)).toEqualTypeOf<() => Promise<number>>();
});
