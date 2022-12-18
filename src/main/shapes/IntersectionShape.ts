import { AnyShape, Shape } from './Shape';
import { InferUnion } from './UnionShape';
import { createIssueFactory, isArray, isAsyncShapes, isEqual, ok } from '../utils';
import { ApplyResult, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { CODE_INTERSECTION, MESSAGE_INTERSECTION } from '../constants';

// prettier-ignore
export type InferIntersection<U extends readonly AnyShape[], C extends 'input' | 'output'> =
  UnionToIntersection<InferUnion<U, C>>;

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export class IntersectionShape<U extends readonly AnyShape[]> extends Shape<
  InferIntersection<U, 'input'>,
  InferIntersection<U, 'output'>
> {
  protected _issueFactory;

  constructor(readonly shapes: U, options?: TypeConstraintOptions | Message) {
    super([], isAsyncShapes(shapes));

    this._issueFactory = createIssueFactory(CODE_INTERSECTION, MESSAGE_INTERSECTION, options, undefined);
  }

  protected _apply(input: unknown, options: ParseOptions): ApplyResult<InferIntersection<U, 'output'>> {
    const { shapes } = this;
    const shapesLength = shapes.length;

    let outputs: any[] | null = null;

    for (let i = 0; i < shapesLength; ++i) {
      const result = shapes[i]['_apply'](input, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        return result;
      }
      const output = result.value;

      if (outputs === null) {
        outputs = [output];
        continue;
      }
      if (outputs.includes(output)) {
        continue;
      }
      outputs.push(output);
    }

    if (outputs === null) {
      return null;
    }
    if (outputs.length !== shapesLength) {
      outputs.push(input);
    }
    return intersectOutputs(input, outputs, this._issueFactory, options);
  }

  protected _applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferIntersection<U, 'output'>>> {
    const { shapes } = this;
    const shapesLength = shapes.length;

    const promises: Promise<ApplyResult>[] = [];

    for (let i = 0; i < shapesLength; ++i) {
      promises.push(shapes[i]['_applyAsync'](input, options));
    }

    return Promise.all(promises).then(results => {
      let outputs: any[] | null = null;

      for (let i = 0; i < shapesLength; ++i) {
        const result = results[i];

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          return result;
        }
        const output = result.value;

        if (outputs === null) {
          outputs = [output];
          continue;
        }
        if (outputs.includes(output)) {
          continue;
        }
        outputs.push(output);
      }

      if (outputs === null) {
        return null;
      }
      if (outputs.length !== shapesLength) {
        outputs.push(input);
      }
      return intersectOutputs(input, outputs, this._issueFactory, options);
    });
  }
}

const NEVER = Symbol();

function intersectOutputs(
  input: unknown,
  outputs: any[],
  issueFactory: (input: unknown, options: Readonly<ParseOptions>) => Issue,
  options: ParseOptions
): ApplyResult {
  const outputsLength = outputs.length;

  let value = outputs[0];

  for (let i = 1; i < outputsLength; ++i) {
    value = intersectPair(value, outputs[i]);

    if (value === NEVER) {
      return [issueFactory(input, options)];
    }
  }

  return ok(value);
}

function intersectPair(a: any, b: any): any {
  if (isEqual(a, b)) {
    return a;
  }

  const aType = Shape.typeof(a);
  const bType = Shape.typeof(b);

  if (aType !== bType) {
    return NEVER;
  }

  if (aType === 'object') {
    const output = Object.assign({}, a, b);

    for (const key in a) {
      if (key in b) {
        const outputValue = intersectPair(a[key], b[key]);

        if (outputValue === NEVER) {
          return NEVER;
        }
        output[key] = outputValue;
      }
    }
    return output;
  }

  if (aType === 'array') {
    const aLength = a.length;

    if (aLength === b.length) {
      let output = a;

      for (let i = 0; i < aLength; ++i) {
        const aValue = a[i];
        const bValue = b[i];

        if (isEqual(aValue, bValue)) {
          continue;
        }
        if (output === a) {
          output = a.slice(0);
        }
        const outputValue = intersectPair(aValue, bValue);

        if (outputValue === NEVER) {
          return NEVER;
        }
        output[i] = outputValue;
      }

      return output;
    }
  }

  return NEVER;
}
