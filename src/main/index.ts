import shapePlugin from './plugins/shape';
import arrayPlugin from './plugins/array';
import datePlugin from './plugins/date';
import numberPlugin from './plugins/number';
import setPlugin from './plugins/set';
import stringPlugin from './plugins/string';

export type * from './plugins/shape';
export type * from './plugins/array';
export type * from './plugins/date';
export type * from './plugins/number';
export type * from './plugins/set';
export type * from './plugins/string';

export * from './core';

shapePlugin();
arrayPlugin();
datePlugin();
numberPlugin();
setPlugin();
stringPlugin();
