import { AnyType, InferType, Type } from './Type';
import { ParserContext } from '../ParserContext';
import { createIssue, isObjectLike } from '../utils';
import { Dict } from '../shared-types';

/**
 * The key-value record type definition.
 *
 * @template K The type definition that constrains record keys.
 * @template V The type definition that constrains record values.
 */
export class RecordType<K extends Type<string>, V extends AnyType> extends Type<Record<InferType<K>, InferType<V>>> {
  /**
   *
   * @param _keyType The type definition that constrains record keys. If `null` then keys aren't constrained at runtime.
   * @param _valueType The type definition that constrains record values.
   */
  constructor(private _keyType: K | null, private _valueType: V) {
    super();
  }

  isAsync(): boolean {
    return this._keyType?.isAsync() || this._valueType.isAsync();
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
          _valueType._parse(value, context.fork().enterKey(key))
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
