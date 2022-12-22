import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { anyTypes, concatIssues, createIssueFactory, getValueType, isArray, isAsyncShapes } from '../utils';
import { CODE_UNION, MESSAGE_UNION, TYPE_ANY } from '../constants';

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template U The list of united shapes.
 */
export class UnionShape<U extends readonly AnyShape[]> extends Shape<U[number]['input'], U[number]['output']> {
  protected _options;
  protected _buckets;
  protected _inputTypes;
  protected _issueFactory;

  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The list of united shapes.
   * @param options The union constraint options or an issue message.
   * @template U The list of united shapes.
   */
  constructor(
    /**
     * The list of united shapes.
     */
    readonly shapes: U,
    options?: TypeConstraintOptions | Message
  ) {
    super();

    const { buckets, inputTypes } = createUnionBuckets(shapes);

    this._options = options;
    this._buckets = buckets;
    this._inputTypes = inputTypes;
    this._issueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options, inputTypes);
  }

  at(key: unknown): AnyShape | null {
    const valueShapes: AnyShape[] = [];

    for (const shape of this.shapes) {
      const valueShape = shape.at(key);

      if (valueShape !== null) {
        valueShapes.push(valueShape);
      }
    }

    if (valueShapes.length === 0) {
      return null;
    }
    if (valueShapes.length === 1) {
      return valueShapes[0];
    }
    return new UnionShape(valueShapes);
  }

  protected _checkAsync(): boolean {
    return isAsyncShapes(this.shapes);
  }

  protected _getInputTypes(): ValueType[] {
    return this._inputTypes;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<U[number]['output']> {
    const { _applyChecks } = this;

    const bucket = this._buckets[getValueType(input)];

    let issues: Issue[] | null = null;
    let result: ApplyResult = null;
    let output = input;
    let bucketLength = 0;
    let index = 0;

    if (bucket !== null) {
      for (bucketLength = bucket.length; index < bucketLength; ++index) {
        result = bucket[index]['_apply'](input, options);

        if (result === null) {
          break;
        }
        if (isArray(result)) {
          issues = concatIssues(issues, result);
          continue;
        }
        output = result.value;
        break;
      }
    }

    if (index === bucketLength) {
      return issues !== null ? issues : this._issueFactory(input, options);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<U[number]['output']>> {
    const { _applyChecks } = this;

    const bucket = this._buckets[getValueType(input)];

    if (bucket === null) {
      return Promise.resolve(this._issueFactory(input, options));
    }

    const bucketLength = bucket.length;

    let issues: Issue[] | null = null;
    let index = 0;

    const nextShape = (): Promise<ApplyResult<U[number]['output']>> => {
      return bucket[index]['_applyAsync'](input, options).then(result => {
        ++index;

        let output = input;

        if (result !== null) {
          if (isArray(result)) {
            issues = concatIssues(issues, result);

            if (index === bucketLength) {
              return issues;
            }
            return nextShape();
          }
          output = result.value;
        }

        if (_applyChecks !== null) {
          issues = _applyChecks(output, null, options);

          if (issues !== null) {
            return issues;
          }
        }
        return result;
      });
    };

    return nextShape();
  }
}

/**
 * Creates a mapping from the value type to an array of shapes that are applicable.
 *
 * @param shapes The list of united shapes.
 */
export function createUnionBuckets(shapes: readonly AnyShape[]): {
  buckets: Record<ValueType, readonly AnyShape[] | null>;
  inputTypes: ValueType[];
} {
  const buckets: Record<ValueType, AnyShape[] | null> = {
    object: null,
    array: null,
    function: null,
    string: null,
    symbol: null,
    number: null,
    bigint: null,
    boolean: null,
    date: null,
    null: null,
    undefined: null,
    any: null,
    never: null,
  };

  let anyEnabled = false;
  let bucketTypes: ValueType[] | undefined;

  for (const shape of unwrapUnionShapes(shapes)) {
    const inputTypes = shape['_getInputTypes']();

    if (inputTypes.includes(TYPE_ANY)) {
      anyEnabled = true;

      for (const type in buckets) {
        buckets[type as ValueType] = pushUnique(buckets[type as ValueType], shape);
      }
      continue;
    }

    // Populate buckets that require specific input types
    for (const type of inputTypes) {
      buckets[type] = pushUnique(buckets[type], shape);
      bucketTypes = pushUnique(bucketTypes, type);
    }
  }

  return { buckets, inputTypes: anyEnabled ? anyTypes : bucketTypes || anyTypes };
}

function pushUnique<T>(array: T[] | null | undefined, value: T): T[] {
  if (!array) {
    return [value];
  }
  if (!array.includes(value)) {
    array.push(value);
  }
  return array;
}

/**
 * Unwraps nested union shapes that don't have any checks.
 */
function unwrapUnionShapes(opaqueShapes: readonly AnyShape[]): AnyShape[] {
  const shapes: AnyShape[] = [];

  for (const shape of opaqueShapes) {
    if (shape instanceof UnionShape && shape.checks.length === 0) {
      shapes.push(...unwrapUnionShapes(shape.shapes));
    } else {
      shapes.push(shape);
    }
  }
  return shapes;
}
