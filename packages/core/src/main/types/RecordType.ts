import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, isObjectLike } from '../utils';
import { Dict } from '../shared-types';

export class RecordType<K extends Type<string> | Type<number>, V extends Type> extends Type<
  Record<InferType<K>, InferType<V>>
> {
  constructor(private _keyType: K, private _valueType: V) {
    super();
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!isObjectLike(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'object'));
      return input;
    }

    const entries = Object.entries(input);
    const { _keyType, _valueType } = this;

    if (this.isAsync()) {
    }

    const record: Dict = {};

    for (const [key, v] of entries) {
      record[_keyType._parse(key, context)] = _valueType._parse(v, context);

      if (context.aborted) {
        return input;
      }
    }
  }
}
