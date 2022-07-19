import { InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, isObjectLike } from '../utils';
import { Dict } from '../shared-types';

export class RecordType<V extends Type, K extends Type<string> | Type<number> = Type> extends Type<
  Record<InferType<K>, InferType<V>>
> {
  constructor(private _valueType: V, private _keyType: K | null) {
    super();
  }

  _parse(input: unknown, context: ParserContext): any {
    if (!isObjectLike(input)) {
      context.raiseIssue(createIssue(context, 'type', input, 'object'));
      return input;
    }

    const { _keyType, _valueType } = this;
    const inputEntries = Object.entries(input);

    if (this.isAsync()) {
      const promises = [];

      for (const [key, value] of inputEntries) {
        promises.push(
          // Output key
          _keyType === null ? key : _keyType._parse(key, context),

          // Output value
          _valueType._parse(value, context.fork(false).enterKey(key))
        );
      }

      return Promise.all(promises).then(results => {
        if (context.aborted) {
          return input;
        }
        const output: Dict = {};

        for (let i = 0; i < promises.length; i += 2) {
          output[results[i]] = results[i + 1];
        }
        return output;
      });
    }

    const output: Dict = {};

    for (const [key, value] of inputEntries) {
      const outputKey = _keyType === null ? key : _keyType._parse(key, context);

      if (context.aborted) {
        return input;
      }

      context.enterKey(key);
      output[outputKey] = _valueType._parse(value, context);
      context.exitKey();

      if (context.aborted) {
        return input;
      }
    }
    return output;
  }
}
