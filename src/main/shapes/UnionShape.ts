import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createIssueFactory, getInputTypes, isArray, isAsyncShapes, unique } from '../utils';
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
  protected _anyBucket;

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

    const { buckets, anyBucket } = createUnionBuckets(shapes);

    this._typeIssueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, options);
    this._buckets = buckets;
    this._anyBucket = anyBucket;
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
    const { _buckets, _anyBucket, _applyChecks } = this;

    const bucket = _buckets !== null ? _buckets[Shape.typeof(input)] || _anyBucket : _anyBucket;

    let issues: Issue[] | null = null;
    let result: ApplyResult = null;
    let output = input;
    let bucketLength = 0;
    let index = 0;

    if (bucket !== null) {
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
      return [this._typeIssueFactory(input, { inputTypes: this.inputTypes, issues })];
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

/**
 * Creates a mapping from the value type to an array of shapes that are applicable.
 *
 * @param shapes The list of united shapes.
 */
export function createUnionBuckets(shapes: readonly AnyShape[]): {
  buckets: Partial<Record<ValueType, readonly AnyShape[]>> | null;
  anyBucket: readonly AnyShape[] | null;
} {
  let buckets: Partial<Record<string, AnyShape[]>> | null = {};
  let anyBucket: AnyShape[] | null = null;
  let bucketTypes: ValueType[] = [];

  for (const shape of unwrapUnionShapes(shapes)) {
    // Collect shapes that can parse any input
    if (shape.inputTypes.includes('any')) {
      anyBucket ||= [];

      if (!anyBucket.includes(shape)) {
        anyBucket.push(shape);
      }
      continue;
    }

    // Populate buckets that require specific input types
    for (const type of shape.inputTypes) {
      const bucket = buckets[type];

      if (!bucket) {
        bucketTypes.push(type);
        buckets[type] = [shape];
        continue;
      }
      if (!bucket.includes(shape)) {
        bucket.push(shape);
      }
    }
  }

  if (bucketTypes.length === 0) {
    buckets = null;
  } else if (anyBucket !== null && buckets !== null) {
    for (const type of bucketTypes) {
      buckets[type] = unique(buckets[type]!.concat(anyBucket));
    }
  }

  return { buckets, anyBucket };
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
