import { CODE_TYPE_UNION, MESSAGE_TYPE_UNION } from '../constants.ts';
import { unique } from '../internal/arrays.ts';
import { isArray, isObject } from '../internal/lang.ts';
import { defineReadonlyProperty, ReadonlyDict } from '../internal/objects.ts';
import { applyShape, isAsyncShapes, toDeepPartialShape } from '../internal/shapes.ts';
import { isType } from '../internal/types.ts';
import { Type } from '../Type.ts';
import { Issue, IssueOptions, Message, ParseOptions, Result } from '../types.ts';
import { createIssue } from '../utils.ts';
import { ObjectShape } from './ObjectShape.ts';
import { AnyShape, DeepPartialProtocol, DeepPartialShape, Input, Output, Shape } from './Shape.ts';

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

  /**
   * Returns an array of shapes that should be applied to the input.
   */
  private get _lookup(): LookupCallback {
    return defineReadonlyProperty(this, '_lookup', createLookup(unique(this.shapes)));
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

  protected _apply(input: unknown, options: ParseOptions, nonce: number): Result<Output<Shapes[number]>> {
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
      return [
        createIssue(
          CODE_TYPE_UNION,
          input,
          MESSAGE_TYPE_UNION,
          { inputs: this.inputs, issueGroups },
          options,
          this._options
        ),
      ];
    }
    return this._applyOperations(input, output, options, null) as Result;
  }

  protected _applyAsync(input: unknown, options: ParseOptions, nonce: number): Promise<Result<Output<Shapes[number]>>> {
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
        return [
          createIssue(
            CODE_TYPE_UNION,
            input,
            MESSAGE_TYPE_UNION,
            { inputs: this.inputs, issueGroups },
            options,
            this._options
          ),
        ];
      };

      resolve(next());
    });
  }
}

type ObjectShapeLike = ObjectShape<ReadonlyDict<AnyShape>, AnyShape | null>;

export type LookupCallback = (input: any) => readonly AnyShape[];

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

export function createLookup(shapes: readonly AnyShape[]): LookupCallback {
  const emptyArray: AnyShape[] = [];
  const buckets: { [type: string]: AnyShape[] } = {
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

  const objectShapes: ObjectShapeLike[] = [];
  const bucketInputs = Object.keys(buckets);

  for (const shape of shapes) {
    if (shape instanceof ObjectShape) {
      objectShapes.push(shape);
    }

    const inputs = shape.inputs;
    const types = inputs[0] === Type.UNKNOWN ? bucketInputs : unique(inputs.map(input => Type.of(input).name));

    for (const type of types) {
      buckets[type] = buckets[type].concat(shape);
    }
  }

  let discriminator;

  if (objectShapes.length !== shapes.length) {
    // Mixed shape types in the union
    return input => buckets[Type.of(input).name];
  }
  if (objectShapes.length > 1 && (discriminator = getDiscriminator(objectShapes)) !== null) {
    // Discriminated object union
    return createDiscriminatorLookup(objectShapes, discriminator);
  }
  // Non-discriminated object union
  return input => (isObject(input) ? objectShapes : emptyArray);
}

/**
 * Creates a lookup that uses a discriminator to detect which shape to use.
 */
export function createDiscriminatorLookup(shapes: ObjectShapeLike[], discriminator: Discriminator): LookupCallback {
  const { key, valueGroups } = discriminator;
  const shapeGroups: [ObjectShapeLike][] = [];
  const emptyArray: AnyShape[] = [];

  for (const shape of shapes) {
    shapeGroups.push([shape]);
  }

  // If each shape has a single value associated with it then indexOf is used for lookup
  let shapeValues: unknown[] | null = [];
  for (const values of valueGroups) {
    if (values.length !== 1 || values[0] !== values[0]) {
      // NaN cannot be used with indexOf
      shapeValues = null;
      break;
    }
    shapeValues.push(values[0]);
  }

  if (shapeValues !== null) {
    return input => {
      let index;
      if (isObject(input) && (index = shapeValues!.indexOf(input[key])) !== -1) {
        return shapeGroups[index];
      }
      return emptyArray;
    };
  }

  return input => {
    if (isObject(input)) {
      const value = input[key];

      for (let i = 0; i < valueGroups.length; ++i) {
        if (valueGroups[i].includes(value)) {
          return shapeGroups[i];
        }
      }
    }
    return emptyArray;
  };
}

/**
 * Discriminator conforms the following rules:
 *
 * - A key that is common for all provided object shapes;
 * - Values that correspond to the key are discrete;
 * - Values uniquely identify each shape.
 */
export function getDiscriminator(shapes: ObjectShapeLike[]): Discriminator | null {
  const seenValues = new Set();
  const valueGroups = [];

  next: for (const key of shapes[0].keys) {
    seenValues.clear();

    for (let i = 0; i < shapes.length; ++i) {
      const shape = shapes[i];
      const valueShape = shape.propShapes[key];

      let inputs;

      if (!(valueShape instanceof Shape) || (inputs = valueShape.inputs).length === 0 || inputs.some(isType)) {
        // No such known key in an object, or not a literal
        continue next;
      }
      for (const input of inputs) {
        if (seenValues.has(input)) {
          // Non-unique value
          continue next;
        }
        seenValues.add(input);
      }
      valueGroups[i] = inputs;
    }
    return { key, valueGroups };
  }
  return null;
}
