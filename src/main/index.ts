import arrayChecks from './plugins/array-checks';
import bigintChecks from './plugins/bigint-checks';
import dateChecks from './plugins/date-checks';
import numberChecks from './plugins/number-checks';
import setChecks from './plugins/set-checks';
import shape from './plugins/shape';
import stringChecks from './plugins/string-checks';

export type * from './plugins/array-checks';
export type * from './plugins/bigint-checks';
export type * from './plugins/date-checks';
export type * from './plugins/number-checks';
export type * from './plugins/set-checks';
export type * from './plugins/shape';
export type * from './plugins/string-checks';

export * from './core';

arrayChecks();
bigintChecks();
dateChecks();
numberChecks();
setChecks();
shape();
stringChecks();
