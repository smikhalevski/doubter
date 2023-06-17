import arrayPlugin from './plugins/array';
import bigintPlugin from './plugins/bigint';
import datePlugin from './plugins/date';
import numberPlugin from './plugins/number';
import setPlugin from './plugins/set';
import shapePlugin from './plugins/shape';
import stringPlugin from './plugins/string';

export type * from './plugins/array';
export type * from './plugins/bigint';
export type * from './plugins/date';
export type * from './plugins/number';
export type * from './plugins/set';
export type * from './plugins/shape';
export type * from './plugins/string';

export * from './core';

arrayPlugin();
bigintPlugin();
datePlugin();
numberPlugin();
setPlugin();
shapePlugin();
stringPlugin();
