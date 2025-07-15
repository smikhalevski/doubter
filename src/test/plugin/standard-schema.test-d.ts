import { StandardSchemaV1 } from '@standard-schema/spec';
import { expectType } from 'tsd';
import * as d from '../../main/index.js';

const shape = d.array(d.const(111).convert(() => 'aaa'));

expectType<111[]>(null! as StandardSchemaV1.InferInput<typeof shape>);

expectType<string[]>(null! as StandardSchemaV1.InferOutput<typeof shape>);
