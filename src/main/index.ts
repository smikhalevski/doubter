import applyArrayPlugin from './plugins/array';
import applyNumberPlugin from './plugins/number';
import applySetPlugin from './plugins/set';
import applyStringPlugin from './plugins/string';

export type * from './plugins/array';
export type * from './plugins/number';
export type * from './plugins/set';
export type * from './plugins/string';

export * from './core';

applyArrayPlugin();
applyNumberPlugin();
applySetPlugin();
applyStringPlugin();
