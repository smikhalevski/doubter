import { AnyShape, ApplyResult, Shape, ValueType } from './Shape';
import { ConstraintOptions, Issue, Message, ParseOptions } from '../shared-types';
import { concatIssues, createIssueFactory, getValueType, isArray, isAsyncShapes, isObjectLike, unique } from '../utils';
import { CODE_UNION, MESSAGE_UNION, TYPE_ANY, TYPE_NEVER } from '../constants';
import { ObjectShape } from './ObjectShape';

/**
 * Returns the list of shapes that are applicable to the input.
 */
export type LookupCallback = (input: any) => readonly AnyShape[];

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template U The list of shapes that comprise a union.
 */
export class UnionShape<U extends readonly AnyShape[]> extends Shape<U[number]['input'], U[number]['output']> {
  protected _options;
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The list of shapes that comprise a union.
   * @param options The union constraint options or an issue message.
   * @template U The list of shapes that comprise a union.
   */
  constructor(
    /**
     * The list of shapes that comprise a union.
     */
    readonly shapes: U,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options);
  }

  protected get _lookup(): LookupCallback {
    const cb = createDiscriminatorLookupCallback(this.shapes) || createValueTypeLookupCallback(this.shapes);

    Object.defineProperty(this, '_lookup', { value: cb });

    return cb;
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

  protected _requiresAsync(): boolean {
    return isAsyncShapes(this.shapes);
  }

  protected _getInputTypes(): ValueType[] {
    const inputTypes: ValueType[] = [];

    for (const shape of this.shapes) {
      inputTypes.push(...shape['_getInputTypes']());
    }
    return unique(inputTypes);
  }

  protected _getInputValues(): unknown[] {
    const inputValues = [];

    for (const shape of this.shapes) {
      const values = shape['_getInputValues']();
      if (values.length === 0) {
        return [];
      }
      inputValues.push(...values);
    }
    return inputValues;
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<U[number]['output']> {
    const { _applyChecks } = this;

    let result = null;
    let issues = null;
    let output = input;
    let index;

    const shapes = this._lookup(input);
    const shapesLength = shapes.length;

    for (index = 0; index < shapesLength; ++index) {
      result = shapes[index]['_apply'](input, options);

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
    if (index === shapesLength) {
      return issues !== null ? issues : this._typeIssueFactory(input, options, this._getInputTypes());
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<U[number]['output']>> {
    const { _applyChecks } = this;

    const shapes = this._lookup(input);
    const shapesLength = shapes.length;

    if (shapesLength === 0) {
      return Promise.resolve(this._typeIssueFactory(input, options, this._getInputTypes()));
    }

    let issues: Issue[] | null = null;
    let index = 0;

    const nextShape = (): Promise<ApplyResult<U[number]['output']>> => {
      return shapes[index]['_applyAsync'](input, options).then(result => {
        ++index;

        let output = input;

        if (result !== null) {
          if (isArray(result)) {
            issues = concatIssues(issues, result);

            if (index === shapesLength) {
              return issues;
            }
            return nextShape();
          }
          output = result.value;
        }

        if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
          return result;
        }
        return issues;
      });
    };

    return nextShape();
  }
}

/**
 * Creates a lookup that finds a shape using an input value type.
 */
export function createValueTypeLookupCallback(shapes: readonly AnyShape[]): LookupCallback {
  const buckets: Record<Exclude<ValueType, 'any' | 'never'>, AnyShape[]> = {
    object: [],
    array: [],
    function: [],
    string: [],
    symbol: [],
    number: [],
    bigint: [],
    boolean: [],
    date: [],
    null: [],
    undefined: [],
  };

  const bucketTypes = Object.keys(buckets) as ValueType[];

  for (const shape of unique(shapes)) {
    const inputTypes = shape['_getInputTypes']();

    for (const type of inputTypes.includes(TYPE_ANY) ? bucketTypes : unique(inputTypes)) {
      if (type === TYPE_ANY || type === TYPE_NEVER) {
        continue;
      }
      buckets[type].push(shape);
    }
  }

  return input => buckets[getValueType(input)];
}

/**
 * Creates a lookup that uses a discriminator property, or returns `null` if discriminator cannot be detected.
 */
export function createDiscriminatorLookupCallback(shapes: readonly AnyShape[]): LookupCallback | null {
  const shapesLength = shapes.length;

  if (shapesLength <= 1 || !shapes.every(isObjectShape)) {
    return null;
  }

  const discriminator = getDiscriminator(shapes);

  if (discriminator === null) {
    return null;
  }

  const { key, valuesForShape } = discriminator;
  const shapeArrays = shapes.map(shape => [shape]);
  const noShapesArray: AnyShape[] = [];

  if (valuesForShape.every(values => values.length === 1 && values[0] === values[0])) {
    const values = valuesForShape.map(values => values[0]);

    return input => {
      if (!isObjectLike(input)) {
        return noShapesArray;
      }

      const index = values.indexOf(input[key]);
      if (index === -1) {
        return noShapesArray;
      }
      return shapeArrays[index];
    };
  }

  return input => {
    if (!isObjectLike(input)) {
      return noShapesArray;
    }

    const value = input[key];

    for (let i = 0; i < shapesLength; ++i) {
      if (valuesForShape[i].includes(value)) {
        return shapeArrays[i];
      }
    }
    return noShapesArray;
  };
}

export interface Discriminator {
  /**
   * The discriminator property key.
   */
  key: string;

  /**
   * The discriminator property values for each shape.
   */
  valuesForShape: unknown[][];
}

export function getDiscriminator(shapes: readonly ObjectShape<any, any>[]): Discriminator | null {
  const keys = shapes[0].keys.slice(0);
  const valuesForShapeForKey: unknown[][][] = [];

  for (let i = 0; i < shapes.length && keys.length !== 0; ++i) {
    const shapeValues: unknown[][] = [];
    const { keys: shapeKeys, shapes: shapeShapes } = shapes[i];

    valuesForShapeForKey[i] = shapeValues;

    for (let j = 0; j < keys.length; ++j) {
      const key = keys[j];

      if (shapeKeys.includes(key)) {
        const keyValues: unknown[] = shapeShapes[key]['_getInputValues']();

        if (keyValues.length !== 0) {
          let duplicated = false;

          // Ensure that this set of values wasn't seen for this key in other shapes
          duplicateLookup: for (let k = 0; k < i; ++k) {
            for (const value of valuesForShapeForKey[k][j]) {
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
        valuesForShapeForKey[k].splice(j, 1);
      }
      --j;
    }
  }

  if (keys.length === 0) {
    return null;
  }

  return {
    key: keys[0],
    valuesForShape: valuesForShapeForKey.map(values => values[0]),
  };
}

export function isObjectShape(shape: AnyShape): shape is ObjectShape<any, any> {
  return shape instanceof ObjectShape;
}
