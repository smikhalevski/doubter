import { isArray, isEqual, isObjectLike, objectKeys, objectValues } from '../lang-utils';
import { ApplyResult, Dict, Issue, Message, ParseOptions, TypeConstraintOptions } from '../shared-types';
import { CODE_TYPE, CODE_UNKNOWN_KEYS, MESSAGE_OBJECT_TYPE, MESSAGE_UNKNOWN_KEYS, TYPE_OBJECT } from './constants';
import {
  assignProperty,
  CheckConfig,
  cloneEnumerableKeys,
  cloneKnownKeys,
  concatIssues,
  createCheckConfig,
  createIssue,
  Flags,
  isAsyncShapes,
  isFlagSet,
  ok,
  pushIssue,
  raiseIssue,
  setFlag,
  unshiftPath,
} from '../shape-utils';
import { AnyShape, Shape } from './Shape';

export type Channel = 'input' | 'output';

export type InferObject<P extends Dict<AnyShape>, R extends AnyShape, C extends Channel> = Squash<
  UndefinedAsOptional<{ [K in keyof P]: P[K][C] }> & InferRest<R, C>
>;

export type InferRest<R extends AnyShape, C extends Channel> = R extends Shape ? { [key: string]: R[C] } : unknown;

export type ObjectKey<T extends object> = StringifyPropertyKey<keyof T>;

export type StringifyPropertyKey<K extends PropertyKey> = K extends symbol ? never : K extends number ? `${K}` : K;

export type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

export type UndefinedAsOptional<T> = OmitBy<T, undefined> & Partial<PickBy<T, undefined>>;

export type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

export const enum KeysMode {
  PRESERVED,
  STRIPPED,
  EXACT,
}

export class ObjectShape<P extends Dict<AnyShape>, R extends AnyShape = Shape<never>> extends Shape<
  InferObject<P, R, 'input'>,
  InferObject<P, R, 'output'>
> {
  readonly keys: readonly ObjectKey<P>[];
  protected _typeCheckConfig;
  private _valueShapes: Shape[];
  private _exactCheckConfig: CheckConfig | null = null;

  constructor(
    readonly shapes: Readonly<P>,
    readonly restShape: R | null = null,
    private _options?: TypeConstraintOptions | Message,
    readonly keysMode: KeysMode = KeysMode.PRESERVED
  ) {
    const keys = objectKeys(shapes);
    const valueShapes = objectValues(shapes);

    super((restShape !== null && restShape.async) || isAsyncShapes(valueShapes));

    this.keys = keys as ObjectKey<P>[];

    this._valueShapes = valueShapes;
    this._typeCheckConfig = createCheckConfig(_options, CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT);
  }

  at(key: any): AnyShape | null {
    return this.shapes.hasOwnProperty(key) ? this.shapes[key] : this.restShape;
  }

  extend<T extends Dict<AnyShape>>(shape: ObjectShape<T, any>): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, R>;

  extend<T extends Dict<AnyShape>>(shapes: T): ObjectShape<Pick<P, Exclude<keyof P, keyof T>> & T, R>;

  extend(shape: ObjectShape<any> | Dict): ObjectShape<any, R> {
    const shapes = Object.assign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape);

    return new ObjectShape(shapes, this.restShape, this._options);
  }

  pick<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Pick<P, K[number]>, R> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.indexOf(key) !== -1) {
        shapes[key] = this._valueShapes[i];
      }
    }

    return new ObjectShape<any, R>(shapes, this.restShape, this._options);
  }

  omit<K extends ObjectKey<P>[]>(...keys: K): ObjectShape<Omit<P, K[number]>, R> {
    const shapes: Dict<AnyShape> = {};

    for (let i = 0; i < this.keys.length; ++i) {
      const key = this.keys[i];

      if (keys.indexOf(key) === -1) {
        shapes[key] = this._valueShapes[i];
      }
    }
    return new ObjectShape<any, R>(shapes, this.restShape, this._options);
  }

  exact(options?: TypeConstraintOptions | Message): ObjectShape<P> {
    const shape = new ObjectShape<P>(this.shapes, null, this._options, KeysMode.EXACT);

    shape._exactCheckConfig = createCheckConfig(options, CODE_UNKNOWN_KEYS, MESSAGE_UNKNOWN_KEYS, undefined);

    return shape;
  }

  strip(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options, KeysMode.STRIPPED);
  }

  preserve(): ObjectShape<P> {
    return new ObjectShape<P>(this.shapes, null, this._options);
  }

  rest<T extends AnyShape>(restShape: T): ObjectShape<P, T> {
    return new ObjectShape(this.shapes, restShape, this._options);
  }

  apply(input: unknown, options: ParseOptions): ApplyResult<InferObject<P, R, 'output'>> {
    if (!isObjectLike(input)) {
      return raiseIssue(this._typeCheckConfig, input);
    }
    if (this.keysMode !== KeysMode.PRESERVED) {
      return this._applyStrictKeysSync(input, options);
    }
    if (this.restShape !== null) {
      return this._applyPreservedRestKeysSync(input, options);
    }
    return this._applyPreservedKeysSync(input, options);
  }

  applyAsync(input: unknown, options: ParseOptions): Promise<ApplyResult<InferObject<P, R, 'output'>>> {
    return new Promise(resolve => {
      if (!isObjectLike(input)) {
        return raiseIssue(this._typeCheckConfig, input);
      }

      const { keys, keysMode, restShape, _valueShapes, applyChecks, unsafe } = this;

      const keysLength = keys.length;
      const promises: any[] = [];

      let issues: Issue[] | null = null;
      let output = input;

      let seenCount = 0;
      let seenFlags: Flags = 0;

      let unknownKeys: string[] | null = null;

      for (const key in input) {
        const value = input[key];
        const index = keys.indexOf(key as ObjectKey<P>);

        let valueShape: AnyShape | null = restShape;

        if (index !== -1) {
          seenCount++;
          seenFlags = setFlag(seenFlags, index);

          valueShape = _valueShapes[index];
        }

        if (valueShape !== null) {
          promises.push(key, valueShape.applyAsync(value, options));
          continue;
        }

        if (keysMode === KeysMode.EXACT) {
          if (unknownKeys !== null) {
            unknownKeys.push(key);
            continue;
          }

          unknownKeys = [key];

          if (!options.verbose) {
            break;
          }
          continue;
        }

        if (keysMode === KeysMode.STRIPPED && input === output) {
          output = cloneKnownKeys(input, keys);
        }
      }

      if (unknownKeys !== null) {
        const issue = createIssue(this._exactCheckConfig!, input, unknownKeys);

        if (!options.verbose) {
          return [issue];
        }
        issues = pushIssue(issues, issue);
      }

      if (seenCount !== keysLength) {
        for (let i = 0; i < keysLength; ++i) {
          if (isFlagSet(seenFlags, i)) {
            continue;
          }

          const key = keys[i];
          const value = input[key];

          promises.push(key, _valueShapes[i].applyAsync(value, options));
        }
      }

      resolve(
        Promise.all(promises).then(entries => {
          const entriesLength = 0;

          for (let i = 0; i < entriesLength; i += 2) {
            const key = entries[i];
            const result: ApplyResult = entries[i + 1];

            if (result === null) {
              continue;
            }
            if (isArray(result)) {
              unshiftPath(result, key);

              if (!options.verbose) {
                return result;
              }
              issues = concatIssues(issues, result);
              continue;
            }
            if ((unsafe || issues === null) && !isEqual(input[key], result.value)) {
              if (input === output) {
                output = cloneEnumerableKeys(input);
              }
              assignProperty(output, key, result.value);
            }
          }

          if (applyChecks !== null && (unsafe || issues === null)) {
            issues = applyChecks(output, issues, options);
          }
          if (issues === null && input !== output) {
            return ok(output as InferObject<P, R, 'output'>);
          }
          return issues;
        })
      );
    });
  }

  private _applyPreservedKeysSync(input: Dict, options: ParseOptions): ApplyResult {
    const { keys, _valueShapes, applyChecks, unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    for (let i = 0; i < keysLength; ++i) {
      const key = keys[i];
      const value = input[key];
      const result = _valueShapes[i].apply(value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, key);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if ((unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = cloneEnumerableKeys(input);
        }
        assignProperty(output, key, result.value);
      }
    }

    if (applyChecks !== null && (unsafe || issues === null)) {
      issues = applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  private _applyPreservedRestKeysSync(input: Dict, options: ParseOptions): ApplyResult {
    const { keys, restShape, _valueShapes, applyChecks, unsafe } = this;

    let issues: Issue[] | null = null;
    let output = input;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);
      const valueShape = index !== -1 ? _valueShapes[index] : restShape!;
      const result = valueShape.apply(value, options);

      if (result === null) {
        continue;
      }
      if (isArray(result)) {
        unshiftPath(result, key);

        if (!options.verbose) {
          return result;
        }
        issues = concatIssues(issues, result);
        continue;
      }
      if ((unsafe || issues === null) && !isEqual(value, result.value)) {
        if (input === output) {
          output = cloneEnumerableKeys(input);
        }
        assignProperty(output, key, result.value);
      }
    }

    if (applyChecks !== null && (unsafe || issues === null)) {
      issues = applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }

  private _applyStrictKeysSync(input: Dict, options: ParseOptions): ApplyResult {
    const { keys, keysMode, _valueShapes, applyChecks, unsafe } = this;

    const keysLength = keys.length;

    let issues: Issue[] | null = null;
    let output = input;

    let seenCount = 0;
    let seenFlags: Flags = 0;

    let unknownKeys: string[] | null = null;

    for (const key in input) {
      const value = input[key];
      const index = keys.indexOf(key as ObjectKey<P>);

      if (index !== -1) {
        seenCount++;
        seenFlags = setFlag(seenFlags, index);

        const result = _valueShapes[index].apply(value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftPath(result, key);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if ((unsafe || issues === null) && !isEqual(value, result.value)) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          assignProperty(output, key, result.value);
        }
        continue;
      }

      if (keysMode === KeysMode.EXACT) {
        if (unknownKeys !== null) {
          unknownKeys.push(key);
          continue;
        }

        unknownKeys = [key];

        if (!options.verbose) {
          break;
        }
        continue;
      }

      if (input === output && (unsafe || issues === null)) {
        output = cloneKnownKeys(input, keys);
      }
    }

    if (unknownKeys !== null) {
      const issue = createIssue(this._exactCheckConfig!, input, unknownKeys);

      if (!options.verbose) {
        return [issue];
      }
      issues = pushIssue(issues, issue);
    }

    if (seenCount !== keysLength) {
      for (let i = 0; i < keysLength; ++i) {
        if (isFlagSet(seenFlags, i)) {
          continue;
        }

        const key = keys[i];
        const value = input[key];
        const result = _valueShapes[i].apply(value, options);

        if (result === null) {
          continue;
        }
        if (isArray(result)) {
          unshiftPath(result, key);

          if (!options.verbose) {
            return result;
          }
          issues = concatIssues(issues, result);
          continue;
        }
        if ((unsafe || issues === null) && !isEqual(value, result.value)) {
          if (input === output) {
            output = cloneKnownKeys(input, keys);
          }
          assignProperty(output, key, result.value);
        }
      }
    }

    if (applyChecks !== null && (unsafe || issues === null)) {
      issues = applyChecks(output, issues, options);
    }
    if (issues === null && input !== output) {
      return ok(output);
    }
    return issues;
  }
}
