import { CODE_UNION, MESSAGE_UNION } from '../constants';
import { createIssueFactory } from '../helpers';
import { getTypeOf, TYPE_UNKNOWN } from '../Type';
import { ApplyOptions, ConstraintOptions, Issue, Message } from '../types';
import {
  applyShape,
  copyUnsafeChecks,
  Dict,
  getShapeInputs,
  isArray,
  isAsyncShape,
  isObject,
  isType,
  toDeepPartialShape,
  unique,
} from '../utils';
import { ObjectShape } from './ObjectShape';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, INPUT, OUTPUT, Result, Shape } from './Shape';

/**
 * Returns the array of shapes that are applicable to the input.
 */
export type Lookup = (input: any) => readonly AnyShape[];

export type DeepPartialUnionShape<Shapes extends readonly AnyShape[]> = UnionShape<{
  [K in keyof Shapes]: DeepPartialShape<Shapes[K]>;
}>;

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template Shapes The array of shapes that comprise a union.
 */
export class UnionShape<Shapes extends readonly AnyShape[]>
  extends Shape<Shapes[number][INPUT], Shapes[number][OUTPUT]>
  implements DeepPartialProtocol<DeepPartialUnionShape<Shapes>>
{
  /**
   * The union constraint options or an issue message.
   */
  protected _options;

  /**
   * Returns issues associated with an invalid input value type.
   */
  protected _typeIssueFactory;

  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The array of shapes that comprise a union.
   * @param options The union constraint options or an issue message.
   * @template Shapes The array of shapes that comprise a union.
   */
  constructor(
    /**
     * The array of shapes that comprise a union.
     */
    readonly shapes: Shapes,
    options?: ConstraintOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options);
  }

  protected get _lookup(): Lookup {
    const shapes = this.shapes.filter(unique);
    const lookup = createLookupByDiscriminator(shapes) || createLookupByType(shapes);

    Object.defineProperty(this, '_lookup', { configurable: true, value: lookup });

    return lookup;
  }

  at(key: unknown): AnyShape | null {
    const shapes = [];

    for (const shape of this.shapes) {
      const valueShape = shape.at(key);

      if (valueShape !== null) {
        shapes.push(valueShape);
      }
    }
    if (shapes.length === 0) {
      return null;
    }
    if (shapes.length === 1) {
      return shapes[0];
    }
    return new UnionShape(shapes);
  }

  deepPartial(): DeepPartialUnionShape<Shapes> {
    return copyUnsafeChecks(this, new UnionShape<any>(this.shapes.map(toDeepPartialShape), this._options));
  }

  protected _isAsync(): boolean {
    return this.shapes.some(isAsyncShape);
  }

  protected _getInputs(): unknown[] {
    // flatMap
    return ([] as unknown[]).concat(...this.shapes.map(getShapeInputs));
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Shapes[number][OUTPUT]> {
    const { _applyChecks } = this;

    let result = null;
    let output = input;
    let issues = null;
    let issueGroups: Issue[][] | null = null;
    let index = 0;

    const shapes = this._lookup(input);
    const shapesLength = shapes.length;

    while (index < shapesLength) {
      result = shapes[index]['_apply'](input, options, nonce);

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
      return this._typeIssueFactory(input, options, { inputs: this.inputs, issueGroups });
    }

    if (_applyChecks === null || (issues = _applyChecks(output, null, options)) === null) {
      return result;
    }
    return issues;
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<Shapes[number][OUTPUT]>> {
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
          return applyShape(shapes[index], input, options, nonce, handleResult);
        }
        if (shapesLength === 1) {
          return issues;
        }
        return this._typeIssueFactory(input, options, { inputs: this.inputs, issueGroups });
      };

      resolve(next());
    });
  }
}

/**
 * Creates a lookup that finds a shape using an input value type.
 */
export function createLookupByType(shapes: readonly AnyShape[]): Lookup {
  const emptyArray: AnyShape[] = [];

  const buckets: Record<string, AnyShape[]> = {
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

  const bucketNames = Object.keys(buckets);

  for (const shape of shapes) {
    const names =
      shape.inputs[0] === TYPE_UNKNOWN ? bucketNames : shape.inputs.map(input => getTypeOf(input).name).filter(unique);

    for (const name of names) {
      buckets[name] = buckets[name].concat(shape);
    }
  }

  return input => buckets[getTypeOf(input).name];
}

/**
 * Creates a lookup that uses a discriminator property, or returns `null` if discriminator property cannot be detected.
 */
export function createLookupByDiscriminator(shapes: readonly AnyShape[]): Lookup | null {
  const discriminator = shapes.every(isObjectShape) ? getDiscriminator(shapes) : null;

  if (discriminator === null) {
    return null;
  }

  const { key, valueGroups } = discriminator;
  const shapesLength = shapes.length;
  const shapeGroups: [AnyShape][] = [];
  const emptyArray: AnyShape[] = [];

  let monoValues: unknown[] | null = [];

  for (let i = 0; i < shapesLength; ++i) {
    shapeGroups.push([shapes[i]]);

    const valueGroup = valueGroups[i];

    if (monoValues === null || valueGroup.length !== 1 || valueGroup[0] !== valueGroup[0]) {
      monoValues = null;
    } else {
      monoValues.push(valueGroup[0]);
    }
  }

  if (monoValues !== null) {
    return input => {
      let index;
      if (!isObject(input) || (index = monoValues!.indexOf(input[key])) === -1) {
        return emptyArray;
      }
      return shapeGroups[index];
    };
  }

  return input => {
    if (!isObject(input)) {
      return emptyArray;
    }

    const value = input[key];

    for (let i = 0; i < shapesLength; ++i) {
      if (valueGroups[i].includes(value)) {
        return shapeGroups[i];
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
  valueGroups: Array<readonly unknown[]>;
}

/**
 * Returns a discriminator property description. Discriminator conforms the following rules:
 *
 * - has a key that is common for all provided object shapes;
 * - its values are discrete;
 * - its values uniquely identify each shape.
 */
export function getDiscriminator(shapes: readonly ObjectShape<Dict<AnyShape>, any>[]): Discriminator | null {
  if (shapes.length < 2) {
    // Discriminator may exist only among multiple objects
    return null;
  }

  const { keys } = shapes[0];
  const valueGroups: Array<readonly unknown[]> = [];
  const valueSet = new Set();

  nextKey: for (const key of keys) {
    for (let i = 0; i < shapes.length; ++i) {
      const shape = shapes[i];

      if (!shape.keys.includes(key)) {
        // Key doesn't exist on every shape
        continue nextKey;
      }

      const { inputs } = shape.shapes[key];

      if (inputs.length === 0 || inputs.some(isType)) {
        // Values aren't discrete
        continue nextKey;
      }
      valueGroups[i] = inputs;
    }

    valueSet.clear();

    for (let i = 0, valueCount = 0; i < valueGroups.length; ++i) {
      for (const value of valueGroups[i]) {
        if (++valueCount !== valueSet.add(value).size) {
          // Values don't uniquely identify each shape
          continue nextKey;
        }
      }
    }

    return { key, valueGroups };
  }
  return null;
}

function isObjectShape(shape: AnyShape): shape is ObjectShape<Dict<AnyShape>, any> {
  return shape instanceof ObjectShape;
}
