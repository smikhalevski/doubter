import { AnyShape, Shape, ValueType } from './Shape';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { concatIssues, createIssueFactory, getInputTypes, getValueType, isArray, isAsyncShapes } from '../utils';
import { CODE_UNION, MESSAGE_UNION } from '../constants';

// prettier-ignore
export type InferUnion<U extends readonly AnyShape[], C extends 'input' | 'output'> =
  { [K in keyof U]: U[K] extends AnyShape ? U[K][C] : never }[number];

/**
 * The shape that requires an input to conform at least one of the united shapes.
 *
 * @template U The list of united shapes.
 */
export class UnionShape<U extends readonly AnyShape[]> extends Shape<InferUnion<U, 'input'>, InferUnion<U, 'output'>> {
  protected _buckets;
  protected _anyBucket;
  protected _issueFactory;

  /**
   * Creates a new {@linkcode UnionShape} instance.
   *
   * @param shapes The list of united shapes.
   * @param _options The union constraint options or an issue message.
   * @template U The list of united shapes.
   */
  constructor(
    /**
     * The list of united shapes.
     */
    readonly shapes: U,
    protected _options?: TypeConstraintOptions | Message
  ) {
    super();

    const { buckets, anyBucket } = createUnionBuckets(shapes);

    this._buckets = buckets;
    this._anyBucket = anyBucket;
    this._issueFactory = createIssueFactory(CODE_UNION, MESSAGE_UNION, _options);
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
    return getInputTypes(this.shapes);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<InferUnion<U, 'output'>> {
    const { _buckets, _anyBucket, _applyChecks } = this;

    const bucket = _buckets !== null ? _buckets[getValueType(input)] || _anyBucket : _anyBucket;

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
      return this._issueFactory(input, options, issues);
    }
    if (_applyChecks !== null) {
      issues = _applyChecks(output, null, options);

      if (issues !== null) {
        return issues;
      }
    }
    return result;
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferUnion<U, 'output'>>> {
    const { _buckets, _anyBucket, _applyChecks } = this;

    const bucket = _buckets !== null ? _buckets[getValueType(input)] || _anyBucket : _anyBucket;

    if (bucket === null) {
      return Promise.resolve(this._issueFactory(input, options, []));
    }

    const bucketLength = bucket.length;

    let issues: Issue[] | null = null;
    let index = 0;

    const nextShape = (): Promise<ApplyResult<InferUnion<U, 'output'>>> => {
      return bucket[index]['_applyAsync'](input, options).then(result => {
        ++index;

        let output = input;

        if (result !== null) {
          if (isArray(result)) {
            issues = concatIssues(issues, result);

            if (index === bucketLength) {
              return this._issueFactory(input, options, issues);
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
  buckets: Partial<Record<ValueType, readonly AnyShape[]>> | null;
  anyBucket: readonly AnyShape[] | null;
} {
  let buckets: Partial<Record<ValueType, AnyShape[]>> | null = {};
  let anyBucket: AnyShape[] | null = null;
  let bucketTypes: ValueType[] = [];

  for (const shape of unwrapUnionShapes(shapes)) {
    const inputTypes = shape['_getInputTypes']();

    // Collect shapes that can parse any input
    if (inputTypes.includes('any')) {
      anyBucket ||= [];

      if (!anyBucket.includes(shape)) {
        anyBucket.push(shape);
      }
      continue;
    }

    // Populate buckets that require specific input types
    for (const type of inputTypes) {
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
      const bucket = buckets[type]!;

      for (const shape of anyBucket) {
        if (!bucket.includes(shape)) {
          bucket.push(shape);
        }
      }
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
