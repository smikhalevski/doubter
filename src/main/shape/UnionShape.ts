import { CODE_TYPE_UNION } from '../constants';
import { unique } from '../internal/arrays';
import { defineProperty, isArray, isObject } from '../internal/lang';
import { Dict, ReadonlyDict } from '../internal/objects';
import { applyShape, isAsyncShapes, toDeepPartialShape } from '../internal/shapes';
import { isType } from '../internal/types';
import { getTypeOf, TYPE_UNKNOWN } from '../Type';
import { ApplyOptions, Issue, IssueOptions, Message, Result } from '../typings';
import { createIssueFactory } from '../utils';
import { CoercibleShape } from './CoercibleShape';
import { ObjectShape } from './ObjectShape';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Input, Output, Shape } from './Shape';

/**
 * Returns the array of shapes that are applicable to the input.
 */
type LookupCallback = (input: any) => readonly AnyShape[];

type DeepPartialUnionShape<Shapes extends readonly AnyShape[]> = UnionShape<{
  [K in keyof Shapes]: DeepPartialShape<Shapes[K]>;
}>;

/**
 * The shape that requires an input to conform at least one of shapes.
 *
 * @template Shapes The array of shapes that comprise a union.
 * @group Shapes
 */
export class UnionShape<Shapes extends readonly AnyShape[]>
  extends Shape<Input<Shapes[number]>, Output<Shapes[number]>>
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
   * Creates a new {@link UnionShape} instance.
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
    options?: IssueOptions | Message
  ) {
    super();

    this._options = options;
    this._typeIssueFactory = createIssueFactory(CODE_TYPE_UNION, Shape.messages[CODE_TYPE_UNION], options);
  }

  protected get _lookup(): LookupCallback {
    const shapes = unique(this.shapes);

    return defineProperty(this, '_lookup', createLookupByDiscriminator(shapes) || createLookupByType(shapes), true);
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
    return new UnionShape<any>(this.shapes.map(toDeepPartialShape), this._options);
  }

  protected _isAsync(): boolean {
    return isAsyncShapes(this.shapes);
  }

  protected _getInputs(): readonly unknown[] {
    const inputs = [];

    for (const shape of this.shapes) {
      inputs.push(...shape.inputs);
    }
    return inputs;
  }

  protected _apply(input: unknown, options: ApplyOptions, nonce: number): Result<Output<Shapes[number]>> {
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
      return [this._typeIssueFactory(input, options, { inputs: this.inputs, issueGroups })];
    }
    return this._applyOperations(input, output, options, null);
  }

  protected _applyAsync(input: unknown, options: ApplyOptions, nonce: number): Promise<Result<Output<Shapes[number]>>> {
    return new Promise(resolve => {
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
        return this._applyOperations(input, output, options, null);
      };

      const next = (): Result | Promise<Result> => {
        index++;

        if (index !== shapesLength) {
          return applyShape(shapes[index], input, options, nonce, handleResult);
        }
        if (shapesLength === 1) {
          return issues;
        }
        return [this._typeIssueFactory(input, options, { inputs: this.inputs, issueGroups })];
      };

      resolve(next());
    });
  }
}

/**
 * Creates a lookup that finds a shape using an input value type.
 */
export function createLookupByType(shapes: readonly AnyShape[]): LookupCallback {
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
      shape.inputs[0] === TYPE_UNKNOWN ? bucketNames : unique(shape.inputs.map(input => getTypeOf(input).name));

    for (const name of names) {
      buckets[name] = buckets[name].concat(shape);
    }
  }

  return input => buckets[getTypeOf(input).name];
}

/**
 * Creates a lookup that uses a discriminator property, or returns `null` if discriminator property cannot be detected.
 */
export function createLookupByDiscriminator(shapes: readonly AnyShape[]): LookupCallback | null {
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
   * Values for each shape.
   */
  valueGroups: Array<ReadonlyArray<unknown>>;
}

function isObjectShape(shape: AnyShape): shape is ObjectShape<Dict<AnyShape>, any> {
  return shape instanceof ObjectShape;
}

/**
 * Returns a discriminator property description. Discriminator conforms the following rules:
 *
 * - A key that is common for all provided object shapes;
 * - Values that correspond to the key are discrete;
 * - Values uniquely identify each shape.
 */
export function getDiscriminator(
  shapes: readonly ObjectShape<ReadonlyDict<AnyShape>, AnyShape | null>[]
): Discriminator | null {
  const valueGroups: Array<ReadonlyArray<unknown>> = [];
  const seenValues: unknown[] = [];
  const isSeen = seenValues.includes.bind(seenValues);

  nextKey: for (const key of shapes[0].keys) {
    for (let i = 0; i < shapes.length; ++i) {
      const keyShape = shapes[i].propShapes[key];

      if (
        keyShape === undefined ||
        (keyShape instanceof CoercibleShape && keyShape.coercionMode === 'coerce') ||
        keyShape.inputs.length === 0 ||
        keyShape.inputs.some(isType) ||
        keyShape.inputs.some(isSeen)
      ) {
        continue nextKey;
      }
      valueGroups[i] = keyShape.inputs;
      seenValues.push(...keyShape.inputs);
    }

    return { key, valueGroups };
  }
  return null;
}
