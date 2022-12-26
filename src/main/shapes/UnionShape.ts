import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createIssueFactory, getValueType, isArray, isAsyncShapes, isObjectLike, unique } from '../utils';
import { CODE_UNION, MESSAGE_UNION, TYPE_ANY } from '../constants';
import { ObjectShape } from './ObjectShape';

export type LookupCallback = (input: unknown) => AnyShape[];

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template U The list of united shapes.
 */
export class UnionShape<U extends readonly AnyShape[]> extends Shape<U[number]['input'], U[number]['output']> {
  protected _options;
  protected _issueFactory;

  /**
   * Returns the list of shapes that are applicable to the input, or `null` if there are no applicable shapes.
   */
  protected declare _lookup: LookupCallback;

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

    this._options = options;
    this._issueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options, undefined);
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
    return unique(inputValues);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<U[number]['output']> {
    const { _applyChecks } = this;

    let result: ApplyResult = null;
    let issues: Issue[] | null = null;
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

    const shapes = this._lookup(input);
    const shapesLength = shapes.length;

    if (shapesLength === 0) {
      return Promise.resolve(this._issueFactory(input, options));
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

Object.defineProperty(UnionShape.prototype, '_lookup', {
  get(this: UnionShape<any>) {
    const cb = createDiscriminatorLookupCallback(this.shapes) || createBucketLookupCallback(this.shapes);

    Object.defineProperty(this, '_lookup', { value: cb });

    return cb;
  },
});

export function createBucketLookupCallback(shapes: readonly AnyShape[]): LookupCallback {
  const buckets: Record<ValueType, AnyShape[]> = {
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
    any: [],
    never: [],
  };

  for (const shape of unique(unwrapUnionShapes(shapes))) {
    const inputTypes = shape['_getInputTypes']();

    for (const type of inputTypes.includes(TYPE_ANY) ? (Object.keys(buckets) as ValueType[]) : unique(inputTypes)) {
      buckets[type].push(shape);
    }
  }

  return input => buckets[getValueType(input)];
}

/**
 * Unwraps nested union shapes that don't have any checks or lookup.
 */
function unwrapUnionShapes(opaqueShapes: readonly AnyShape[]): AnyShape[] {
  const shapes: AnyShape[] = [];

  for (const shape of opaqueShapes) {
    if (shape instanceof UnionShape && shape.checks.length === 0 && shape['_lookup'] === null) {
      shapes.push(...unwrapUnionShapes(shape.shapes));
    } else {
      shapes.push(shape);
    }
  }
  return shapes;
}

/**
 * Creates a lookup that uses a discriminator property, or returns `null` if discriminator cannot be detected.
 */
export function createDiscriminatorLookupCallback(shapes: readonly AnyShape[]): LookupCallback | null {
  if (!shapes.every((shape): shape is ObjectShape<any, any> => shape instanceof ObjectShape)) {
    return null;
  }

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
  const shapeValues = values.map(values => values[0]);

  if (shapeValues.every(values => values.length === 1 && values[0] === values[0])) {
    const values = shapeValues.map(values => values[0]);

    return input => {
      if (!isObjectLike(input)) {
        return [];
      }

      const index = values.indexOf(input[key]);
      if (index === -1) {
        return [];
      }
      return [shapes[index]];
    };
  }

  return input => {
    if (!isObjectLike(input)) {
      return [];
    }

    const value = input[key];
    const shapesLength = shapes.length;

    for (let i = 0; i < shapesLength; ++i) {
      if (shapeValues[i].includes(value)) {
        return [shapes[i]];
      }
    }
    return [];
  };
}
