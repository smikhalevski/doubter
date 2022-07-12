import { Type } from './Type';
import { ParserContext } from '../ParserContext';
import { InferType } from '../shared-types';

export class RecordType<K extends Type<string> | Type<number>, V extends Type> extends Type<
  Record<InferType<K>, InferType<V>>
> {
  constructor(private _keyType: K, private _valueType: V) {
    super();
  }

  _parse(value: any, context: ParserContext): any {}
}
