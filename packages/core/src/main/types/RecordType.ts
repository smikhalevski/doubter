import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';

export class RecordType<K extends Type<string> | Type<number>, V extends Type> extends Type<
  Record<InferType<K>, InferType<V>>
> {
  constructor(private _keyType: K, private _valueType: V) {
    super();
  }

  _parse(value: unknown, context: ParserContext): any {}
}
