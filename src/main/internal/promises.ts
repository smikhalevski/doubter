// prettier-ignore
export type Awaited<T> =
  T extends null | undefined ? T :
  T extends object & { then(fn: infer F, ...args: any): any } ?
  F extends (value: infer V, ...args: any) => any ? Awaited<V> : never :
  T;

export type Promisify<T> = Promise<Awaited<T>>;

export type Awaitable<T> = Awaited<T> extends T ? Promise<T> | T : T;
