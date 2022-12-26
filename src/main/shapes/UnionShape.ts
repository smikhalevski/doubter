import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createIssueFactory, getValueType, isArray, isAsyncShapes, isObjectLike } from '../utils';
import { CODE_UNION, MESSAGE_UNION, TYPE_ANY } from '../constants';
import { ObjectShape } from './ObjectShape';

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template U The list of united shapes.
 */
export class UnionShape<U extends readonly AnyShape[]> extends Shape<U[number]['input'], U[number]['output']> {
  protected _options;
  protected _buckets;
  protected _discriminator;
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

    if (shapes.every(shape => shape instanceof ObjectShape)) {
      this._discriminator = getDiscriminator(shapes as unknown as readonly ObjectShape<any, any>[]);
    } else {
      this._discriminator = null;
    }
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

  protected _isAsync(): boolean {
    return isAsyncShapes(this.shapes);
  }

  protected _getInputTypes(): ValueType[] {
    return this._inputTypes.slice(0);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<U[number]['output']> {
    const { _discriminator, _applyChecks } = this;

    let issues: Issue[] | null = null;
    let result: ApplyResult = null;
    let output = input;

    if (_discriminator !== null) {
      if (isObjectLike(input)) {
        const shape = _discriminator(input);

        if (shape === null) {
          return this._issueFactory(input, options);
        }

        result = shape['_apply'](input, options);

        if (result !== null) {
          if (isArray(result)) {
            return result;
          }
          output = result.value;
        }
      }
    } else {
      const bucket = this._buckets[getValueType(input)];

      let index = 0;
      let bucketLength = 0;

      if (bucket !== null) {
        for (bucketLength = bucket.length; index < bucketLength; ++index) {
          result = bucket[index]['_apply'](input, options);

          if (result !== null) {
            if (isArray(result)) {
              issues = concatIssues(issues, result);
              continue;
            }
            output = result.value;
          }
          break;
        }
      }
      if (index === bucketLength) {
        return issues !== null ? issues : this._issueFactory(input, options);
      }
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

export interface UnionBuckets {
  /**
   * A list of shapes that are applicable for a particular input value type, or `null` if there are no applicable shapes.
   */
  buckets: Record<ValueType, readonly AnyShape[] | null>;

  /**
   * The list of input types that the union shape can process.
   */
  inputTypes: readonly ValueType[];
}

/**
 * Creates a mapping from the value type to an array of shapes that are applicable.
 *
 * @param shapes The list of united shapes.
 */
export function createUnionBuckets(shapes: readonly AnyShape[]): UnionBuckets {
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
  let bucketTypes: ValueType[] = [];

  for (const shape of unwrapUnionShapes(shapes)) {
    const inputTypes = shape['_getInputTypes']();

    if (inputTypes.includes(TYPE_ANY)) {
      anyEnabled = true;

      for (const type in buckets) {
        buckets[type as ValueType] = pushUnique(buckets[type as ValueType], shape);
      }
      continue;
    }

    for (const type of inputTypes) {
      buckets[type] = pushUnique(buckets[type], shape);
      pushUnique(bucketTypes, type);
    }
  }

  return {
    buckets,
    inputTypes: anyEnabled ? [TYPE_ANY] : bucketTypes,
  };
}

/**
 * Unwraps nested union shapes that don't have any checks or lookup.
 */
function unwrapUnionShapes(opaqueShapes: readonly AnyShape[]): AnyShape[] {
  const shapes: AnyShape[] = [];

  for (const shape of opaqueShapes) {
    if (shape instanceof UnionShape && shape.checks.length === 0 && shape['_discriminator'] === null) {
      shapes.push(...unwrapUnionShapes(shape.shapes));
    } else {
      shapes.push(shape);
    }
  }
  return shapes;
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

// export interface Discriminator {
//   /**
//    * The discriminator key.
//    */
//   key: string;
//
//   /**
//    * The set of allowed values for each shape.
//    */
//   values: Array<readonly unknown[]>;
// }

export function getDiscriminator(shapes: readonly ObjectShape<any, any>[]): ((input: any) => AnyShape | null) | null {
  const keys = shapes[0].keys.slice(0);
  const values: unknown[][][] = [];

  for (let i = 0; i < shapes.length && keys.length !== 0; ++i) {
    const shapeValues: unknown[][] = [];
    const { keys: shapeKeys, shapes: shapeShapes } = shapes[i];

    values[i] = shapeValues;

    for (let j = 0; j < keys.length; ++j) {
      if (shapeKeys.includes(keys[j])) {
        const keyValues: unknown[] = shapeShapes[keys[j]]['_getInputValues']();

        if (keyValues !== null && keyValues.length !== 0) {
          let duplicated = false;

          // Ensure that this set of values wasn't seen for this key in other shapes
          duplicateLookup: for (let k = 0; k < i; ++k) {
            for (const value of values[k][j]) {
              if (keyValues.includes(value)) {
                duplicated = true;
                break duplicateLookup;
              }
            }
          }

          if (!duplicated) {
            shapeValues.push(keyValues);
            continue;
          }
        }
      }

      keys.splice(j, 1);

      for (let k = 0; k < i; ++k) {
        values[k].splice(j, 1);
      }
      --j;
    }
  }

  if (keys.length === 0) {
    return null;
  }

  const key = keys[0];
  const keyValues = values.map(values => values[0]);

  if (keyValues.every(values => values.length === 1 && values[0] === values[0])) {
    const values = keyValues.map(values => values[0]);

    return input => {
      const index = values.indexOf(input[key]);
      if (index === -1) {
        return null;
      }
      return shapes[index];
    };
  }

  return input => {
    const value = input[key];
    for (let i = 0; i < keyValues.length; ++i) {
      if (keyValues[i].includes(value)) {
        return shapes[i];
      }
    }
    return null;
  };
}
