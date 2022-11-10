import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createIssueFactory, getInputTypes, isArray, isAsyncShapes } from '../utils';
import { CODE_UNION, MESSAGE_UNION } from '../constants';

// prettier-ignore
export type InferUnion<U extends readonly AnyShape[], C extends 'input' | 'output'> =
  { [K in keyof U]: U[K][C] }[number];

/**
 * The shape that requires an input to conform at least one of the united shapes.
 *
 * @template U The list of united shapes.
 */
export class UnionShape<U extends readonly AnyShape[]> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  protected _typeIssueFactory;
  protected _buckets;

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
    super(getInputTypes(shapes), isAsyncShapes(shapes));

    this._typeIssueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options);
    this._buckets = createUnionBuckets(shapes);
  }

  at(key: unknown): AnyShape | null {
    const shapes = this.shapes.filter(shape => shape.at(key) !== null);

    if (shapes.length === 0) {
      return null;
    }
    if (shapes.length === 1) {
      return shapes[0];
    }
    return new UnionShape(shapes);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferUnion<U, 'output'>> {
    const { _applyChecks } = this;

    const bucket = this._buckets[Shape.typeof(input)];

    let issues: Issue[] | null = null;
    let result: ApplyResult = null;
    let output = input;
    let bucketLength = 0;
    let index = 0;

    if (bucket !== undefined) {
      for (bucketLength = bucket.length; index < bucketLength; ++index) {
        result = bucket[index].apply(input, options);

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
      return [this._typeIssueFactory(input, issues)];
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferUnion<U, 'output'>>> {
    if (!this.async) {
      return super.applyAsync(input, options);
    }

    const { shapes, _applyChecks, _unsafe } = this;

    const shapesLength = shapes.length;

    let issues: Issue[] | null = null;
    let index = 0;

    const nextShape = (): Promise<ApplyResult<InferUnion<U, 'output'>>> => {
      return shapes[index].applyAsync(input, options).then(result => {
        ++index;

        if (result === null) {
          return null;
        }

        if (isArray(result)) {
          issues = concatIssues(issues, result);

          if (index < shapesLength) {
            return nextShape();
          }

          if (_applyChecks !== null && _unsafe) {
            issues = _applyChecks(input, issues, options);
          }
          return [this._typeIssueFactory(input, issues)];
        }

        return result;
      });
    };

    return nextShape();
  }
}

const valueTypes: ValueType[] = [
  'object',
  'array',
  'function',
  'string',
  'symbol',
  'number',
  'bigint',
  'boolean',
  'null',
  'undefined',
];

/**
 * Creates a mapping from the value type to an array of shapes that are applicable.
 *
 * @param shapes The list of united shapes.
 */
export function createUnionBuckets(shapes: readonly AnyShape[]): Partial<Record<ValueType, AnyShape[]>> {
  const buckets: Partial<Record<ValueType, AnyShape[]>> = {};

  for (const opaqueShape of shapes) {
    for (const shape of unwrapUnionShapes(opaqueShape)) {
      for (const type of valueTypes) {
        const bucket = buckets[type];

        if (shape.inputTypes.indexOf(type) === -1 && shape.inputTypes.indexOf('unknown') === -1) {
          continue;
        }
        if (bucket === undefined) {
          buckets[type] = [shape];
        } else {
          bucket.push(shape);
        }
      }
    }
  }
  return buckets;
}

/**
 * Flattens union shapes that don't have any checks.
 */
function unwrapUnionShapes(shape: AnyShape): AnyShape[] {
  const shapes: AnyShape[] = [];

  if (shape instanceof UnionShape && shape.checks.length === 0) {
    shapes.push(...unwrapUnionShapes(shape));
  } else {
    shapes.push(shape);
  }
  return shapes;
}
