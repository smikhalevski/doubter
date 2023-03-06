import { CODE_UNION, MESSAGE_UNION, TYPE_ANY, TYPE_NEVER } from '../constants';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  copyUnsafeChecks,
  createIssueFactory,
  Dict,
  getShapeInputValues,
  getValueType,
  isArray,
  isAsyncShape,
  isObject,
  toDeepPartialShape,
  uniqueArray,
} from '../utils';
import { ObjectShape } from './ObjectShape';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Result, Shape, Type, ValueType } from './Shape';

/**
 * Returns the array of shapes that are applicable to the input.
 */
export type Lookup = (input: any) => readonly AnyShape[];

export type DeepPartialUnionShape<U extends readonly AnyShape[]> = UnionShape<{
  [K in keyof U]: U[K] extends AnyShape ? DeepPartialShape<U[K]> : never;
}>;

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template U The array of shapes that comprise a union.
 */
export class UnionShape<U extends readonly AnyShape[]>
  extends Shape<U[number]['input'], U[number]['output']>
  implements DeepPartialProtocol<DeepPartialUnionShape<U>>
{
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The array of shapes that comprise a union.
   * @param options The union constraint options or an issue message.
   * @template U The array of shapes that comprise a union.
   */
  constructor(
    /**
     * The array of shapes that comprise a union.
     */
    readonly shapes: U,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options);
  }

  protected get _lookup(): Lookup {
    const lookup = createDiscriminatorLookup(this.shapes) || createValueTypeLookup(this.shapes);

    Object.defineProperty(this, '_lookup', { value: lookup });

    return lookup;
  }

  at(key: unknown): AnyShape | null {
    const valueShapes = [];

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

  deepPartial(): DeepPartialUnionShape<U> {
    return copyUnsafeChecks(this, new UnionShape<any>(this.shapes.map(toDeepPartialShape), this._options));
  }

  protected _isAsync(): boolean {
    return this.shapes.some(isAsyncShape);
  }

  protected _getInputTypes(): readonly Type[] {
    const types: Type[] = [];

    for (const shape of this.shapes) {
      types.push(...shape.inputTypes);
    }
    return types;
  }

  protected _getInputValues(): readonly unknown[] | null {
    const valuesByShape = this.shapes.map(getShapeInputValues);

    if (valuesByShape.indexOf(null) !== -1) {
      return null;
    }
    return ([] as unknown[]).concat(...valuesByShape);
  }

  protected _apply(input: unknown, options: ApplyOptions): Result<U[number]['output']> {
    const { _applyChecks } = this;

    let result = null;
    let output = input;
    let issues = null;
    let issueGroups: Issue[][] | null = null;
    let index = 0;

    const shapes = this._lookup(input);
    const shapesLength = shapes.length;

    while (index < shapesLength) {
      result = shapes[index]['_apply'](input, options);

      if (result === null) {
        break;
      }
      if (!isArray(result)) {
        output = result.value;
        break;
      }
      if (issueGroups === null) {
        issueGroups = [result];
      } else {
        issueGroups.push(result);
      }
      issues = result;
      index++;
    }

    if (index === shapesLength) {
      if (shapesLength === 1) {
        return issues;
      }
      return this._typeIssueFactory(input, options, { inputTypes: this.inputTypes, issueGroups });
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions): Promise<Result<U[number]['output']>> {
    return new Promise(resolve => {
      const { _applyChecks } = this;

      const shapes = this._lookup(input);
      const shapesLength = shapes.length;

      let issues: Issue[] | null = null;
      let issueGroups: Issue[][] | null = null;

      let index = -1;

      const handleResult = (result: Result) => {
        let output = input;

        if (result !== null) {
          if (isArray(result)) {
            if (issueGroups === null) {
              issueGroups = [result];
            } else {
              issueGroups.push(result);
            }
            issues = result;

            return next();
          } else {
            output = result.value;
          }
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== shapesLength) {
          return applyShape(shapes[index], input, options, handleResult);
        }
        if (shapesLength === 1) {
          return issues;
        }
        return this._typeIssueFactory(input, options, { inputTypes: this.inputTypes, issueGroups });
      };

      resolve(next());
    });
  }
}

/**
 * Creates a lookup that finds a shape using an input value type.
 */
export function createValueTypeLookup(shapes: readonly AnyShape[]): Lookup {
  const emptyArray: AnyShape[] = [];

  const buckets: Record<ValueType, readonly AnyShape[]> = {
    object: emptyArray,
    array: emptyArray,
    function: emptyArray,
    string: emptyArray,
    symbol: emptyArray,
    number: emptyArray,
    bigint: emptyArray,
    boolean: emptyArray,
    date: emptyArray,
    promise: emptyArray,
    set: emptyArray,
    map: emptyArray,
    null: emptyArray,
    undefined: emptyArray,
  };

  const bucketTypes = Object.keys(buckets) as Type[];

  for (const shape of uniqueArray(shapes)) {
    for (const type of shape.inputTypes[0] === TYPE_ANY ? bucketTypes : shape.inputTypes) {
      if (type !== TYPE_ANY && type !== TYPE_NEVER) {
        buckets[type] = buckets[type].concat(shape);
      }
    }
  }

  return input => buckets[getValueType(input)];
}

/**
 * Creates a lookup that uses a discriminator property, or returns `null` if discriminator property cannot be detected.
 */
export function createDiscriminatorLookup(shapes: readonly AnyShape[]): Lookup | null {
  const shapesLength = shapes.length;

  shapes = uniqueArray(shapes);

  if (shapesLength <= 1 || !shapes.every(isObjectShape)) {
    return null;
  }

  const discriminator = getDiscriminator(shapes);

  if (discriminator === null) {
    return null;
  }

  const { key, valuesByShape } = discriminator;
  const shapeArrays = shapes.map(shape => [shape]);
  const emptyArray: AnyShape[] = [];

  if (valuesByShape.every(values => values.length === 1 && values[0] === values[0])) {
    const values = valuesByShape.map(values => values[0]);

    return input => {
      if (!isObject(input)) {
        return emptyArray;
      }

      const index = values.indexOf(input[key]);
      if (index === -1) {
        return emptyArray;
      }
      return shapeArrays[index];
    };
  }

  return input => {
    if (!isObject(input)) {
      return emptyArray;
    }

    const value = input[key];

    for (let i = 0; i < shapesLength; ++i) {
      if (valuesByShape[i].includes(value)) {
        return shapeArrays[i];
      }
    }
    return emptyArray;
  };
}

export interface Discriminator {
  /**
   * The discriminator property key.
   */
  key: string;

  /**
   * The values for each shape.
   */
  valuesByShape: Array<readonly unknown[]>;
}

export function getDiscriminator(shapes: readonly ObjectShape<Dict<AnyShape>, any>[]): Discriminator | null {
  const shapesLength = shapes.length;
  const candidateKeys = shapes[0].keys;
  const valuesByShape: Array<readonly unknown[]> = [];
  const candidateValueSet = new Set<unknown>();

  nextCandidate: for (const candidateKey of candidateKeys) {
    for (let i = 0; i < shapesLength; ++i) {
      const shape = shapes[i];

      // Key doesn't exist on every shape
      if (!shape.keys.includes(candidateKey)) {
        continue nextCandidate;
      }

      const { inputValues } = shape.shapes[candidateKey];

      if (inputValues === null || inputValues.length === 0) {
        // Values of this key are continuous or absent for some shapes
        continue nextCandidate;
      }

      valuesByShape[i] = inputValues;
    }

    candidateValueSet.clear();

    let valueCount = 0;

    for (const values of valuesByShape) {
      for (const value of values) {
        candidateValueSet.add(value);

        ++valueCount;

        if (valueCount !== candidateValueSet.size) {
          // Values associated with the candidate key are not unique for each shape
          continue nextCandidate;
        }
      }
    }

    return {
      key: candidateKey,
      valuesByShape,
    };
  }
  return null;
}

function isObjectShape(shape: AnyShape): shape is ObjectShape<any, any> {
  return shape instanceof ObjectShape;
}
