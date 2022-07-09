export class Shape<T = any> {
  protected _default: T | undefined;

  default(value: T): OptionalShape<T> {
    this._default = value;
    return new OptionalShape(this);
  }

  optional(): OptionalShape<T> {
    return new OptionalShape(this);
  }

  nullable(): NullableShape<T> {
    return new NullableShape(this);
  }

  or<S extends Shape>(shape: S): UnionShape<[this, S]> {
    return new UnionShape([this, shape]);
  }

  and<S extends Shape>(shape: S): IntersectionShape<[this, S]> {
    return new IntersectionShape([this, shape]);
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    return null;
  }
}

export type InferType<S extends Shape> = S extends Shape<infer T> ? T : never;

interface PropertyShapes {
  [key: string]: Shape;
}

type InferObjectType<S extends PropertyShapes> = Squash<UndefinedAsOptional<{ [K in keyof S]: InferType<S[K]> }>>;

type Squash<T> = T extends never ? never : { [K in keyof T]: T[K] };

type UndefinedAsOptional<S extends object> = OmitBy<S, undefined> & Partial<PickBy<S, undefined>>;

type OmitBy<T, V> = Omit<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type PickBy<T, V> = Pick<T, { [K in keyof T]: V extends Extract<T[K], V> ? K : never }[keyof T]>;

type Primitive = string | number | bigint | boolean | null | undefined;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export class OptionalShape<T> extends Shape<T | undefined> {
  constructor(public shape: Shape<T>) {
    super();

    if (shape instanceof OptionalShape) {
      return shape;
    }
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    return value === undefined ? null : this.shape.validate(value, errors);
  }
}

export class NullableShape<T> extends Shape<T | null> {
  constructor(public shape: Shape<T>) {
    super();

    if (shape instanceof NullableShape) {
      return shape;
    }
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    return value === undefined ? null : this.shape.validate(value, errors);
  }
}

export class UnionShape<S extends [Shape, ...Shape[]]> extends Shape<{ [K in keyof S]: InferType<S[K]> }[number]> {
  constructor(public shapes: S) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    for (const shape of this.shapes) {
      const shapeErrors = shape.validate(value, errors);
      errors ||= shapeErrors;
    }
    return errors || null;
  }
}

// prettier-ignore
export class IntersectionShape<S extends [Shape, ...Shape[]]> extends Shape<UnionToIntersection<{ [K in keyof S]: InferType<S[K]> }[number]>> {
  constructor(public shapes: S) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    let firstErrors: any[] | null = null;

    for (const shape of this.shapes) {
      const shapeErrors = shape.validate(value);
      if (shapeErrors === null) {
        return null;
      }
      firstErrors ||= shapeErrors;
    }
    return errors != null && firstErrors !== null ? errors.concat(firstErrors) : firstErrors;
  }
}

export class ObjectShape<S extends PropertyShapes> extends Shape<InferObjectType<S>> {
  private readonly _entries: [string, Shape][];
  private _keys: string[] | undefined;

  constructor(public shapes: S) {
    super();
    this._entries = Object.entries(shapes);
  }

  // prettier-ignore
  extend<P extends PropertyShapes, Q extends ObjectShape<P>>(shape: Q): ObjectShape<Pick<S, Exclude<keyof S, keyof P>> & P>;

  extend<P extends PropertyShapes>(shapes: P): ObjectShape<Pick<S, Exclude<keyof S, keyof P>> & P>;

  extend(shape: PropertyShapes | ObjectShape<any>) {
    return new ObjectShape<any>(Object.assign({}, this.shapes, shape instanceof ObjectShape ? shape.shapes : shape));
  }

  partial(): ObjectShape<{ [K in keyof S]: OptionalShape<InferType<S[K]>> }> {
    const shapes: PropertyShapes = {};

    for (const [key, shape] of this._entries) {
      shapes[key] = shape.optional();
    }
    return new ObjectShape<any>(shapes);
  }

  exact(): this {
    this._keys ||= Object.keys(this.shapes);
    return this;
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (value === null || typeof value !== 'object') {
      return appendError(errors, 'Must be an object');
    }

    const { _keys } = this;
    if (_keys !== undefined) {
      for (const key of Object.keys(value)) {
        if (_keys.indexOf(key) !== -1) {
          errors = appendError(errors, 'Unrecognized key ' + key);
        }
      }
    }

    for (const [key, shape] of this._entries) {
      const shapeErrors = shape.validate(value[key], errors);
      errors ||= shapeErrors;
    }
    return errors || null;
  }
}

export class ArrayShape<S extends Shape> extends Shape<InferType<S>[]> {
  private _length?: number;
  private _min?: number;
  private _max?: number;

  constructor(public shape: S) {
    super();
  }

  length(value: number): this {
    this._length = value;
    return this;
  }

  min(value: number): this {
    this._min = value;
    return this;
  }

  max(value: number): this {
    this._max = value;
    return this;
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (!Array.isArray(value)) {
      return appendError(errors, 'Must be an array');
    }

    const valueLength = value.length;

    const { _length } = this;
    if (_length !== undefined && valueLength !== _length) {
      errors = appendError(errors, 'Must have length of ' + _length);
    }

    const { _min } = this;
    if (_min !== undefined && valueLength < _min) {
      errors = appendError(errors, 'Must have length greater than ' + _min);
    }

    const { _max } = this;
    if (_max !== undefined && valueLength > _max) {
      errors = appendError(errors, 'Must have length less than ' + _max);
    }

    const { shape } = this;
    for (let i = 0; i < valueLength; ++i) {
      const shapeErrors = shape.validate(value[i], errors);
      errors ||= shapeErrors;
    }

    return errors || null;
  }
}

export class TupleShape<S extends [Shape, ...Shape[]]> extends Shape<{ [K in keyof S]: InferType<S[K]> }> {
  constructor(public shapes: S) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (!Array.isArray(value)) {
      return appendError(errors, 'Must be a tuple');
    }

    const { shapes } = this;
    const shapesLength = shapes.length;

    if (value.length !== shapesLength) {
      return appendError(errors, 'Must have length of ' + shapesLength);
    }

    for (let i = 0; i < shapes.length; ++i) {
      const shapeErrors = shapes[i].validate(value[i], errors);
      errors ||= shapeErrors;
    }

    return errors || null;
  }
}

export class StringShape extends Shape<string> {
  private _length?: number;
  private _min?: number;
  private _max?: number;
  private _re?: RegExp;

  length(value: number): this {
    this._length = value;
    return this;
  }

  min(value: number): this {
    this._min = value;
    return this;
  }

  max(value: number): this {
    this._max = value;
    return this;
  }

  pattern(re: RegExp): this {
    this._re = re;
    return this;
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (typeof value !== 'string') {
      return appendError(errors, 'Must be a string');
    }

    const valueLength = value.length;

    const { _length } = this;
    if (_length !== undefined && valueLength !== _length) {
      errors = appendError(errors, 'Must have length of ' + _length);
    }

    const { _min } = this;
    if (_min !== undefined && valueLength < _min) {
      errors = appendError(errors, 'Must have length greater than ' + _min);
    }

    const { _max } = this;
    if (_max !== undefined && valueLength > _max) {
      errors = appendError(errors, 'Must have length less than ' + _max);
    }

    const { _re } = this;
    if (_re !== undefined && !_re.test(value)) {
      errors = appendError(errors, 'Must match ' + _re);
    }

    return errors || null;
  }
}

export class NumberShape extends Shape<number> {
  private _min?: number;
  private _max?: number;
  private _inclusiveMin?: number;
  private _inclusiveMax?: number;
  private _divisor?: number;

  gt(value: number): this {
    this._min = value;
    return this;
  }

  lt(value: number): this {
    this._max = value;
    return this;
  }

  gte(value: number): this {
    this._inclusiveMin = value;
    return this;
  }

  lte(value: number): this {
    this._inclusiveMax = value;
    return this;
  }

  multipleOf(value: number): this {
    this._divisor = value;
    return this;
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (typeof value !== 'number') {
      return appendError(errors, 'Must be a number');
    }

    const { _min } = this;
    if (_min !== undefined && value < _min) {
      errors = appendError(errors, 'Must have greater than ' + _min);
    }

    const { _max } = this;
    if (_max !== undefined && value > _max) {
      errors = appendError(errors, 'Must have less than ' + _max);
    }

    const { _inclusiveMin } = this;
    if (_inclusiveMin !== undefined && value < _inclusiveMin) {
      errors = appendError(errors, 'Must have greater than or equal to ' + _inclusiveMin);
    }

    const { _inclusiveMax } = this;
    if (_inclusiveMax !== undefined && value > _inclusiveMax) {
      errors = appendError(errors, 'Must have less than or equal to ' + _inclusiveMax);
    }

    const { _divisor } = this;
    if (_divisor !== undefined && value % _divisor !== 0) {
      errors = appendError(errors, 'Must be a multiple of ' + _divisor);
    }

    return errors || null;
  }
}

export class LiteralShape<T extends Primitive> extends Shape<T> {
  constructor(public value: T) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (this.value !== value) {
      return appendError(errors, 'Must be equal to ' + JSON.stringify(this.value));
    }
    return null;
  }
}

export class EnumShape<U extends Primitive> extends Shape<U> {
  constructor(public values: U[]) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (this.values.indexOf(value) === -1) {
      return appendError(errors, 'Must be one of ' + this.values);
    }
    return null;
  }
}

// prettier-ignore
export class RecordShape<K extends Shape<keyof any>, V extends Shape> extends Shape<Record<InferType<K>, InferType<V>>> {
  constructor(public keyShape: K, public valueShape: V) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    if (value === null || typeof value !== 'object') {
      return appendError(errors, 'Must be a record');
    }

    const { keyShape, valueShape } = this;

    for (const [key, _value] of Object.entries(value)) {
      keyShape.validate(key, errors);
      valueShape.validate(_value, errors);
    }
    return null;
  }
}

export class LazyShape<S extends Shape> extends Shape<S> {
  constructor(private _provider: (value: any) => S) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    return this._provider(value).validate(value, errors);
  }
}

export class WhenShape extends Shape<unknown> {
  constructor(private _condition: (value: any) => any, public shape: Shape) {
    super();
  }

  validate(value: any, errors?: any[] | null): any[] | null {
    return this._condition(value) ? this.shape.validate(value, errors) : null;
  }
}

function appendError(errors: any[] | undefined | null, error: any): any[] {
  (errors ||= []).push(error);
  return errors;
}

export function anyShape(): Shape {
  return new Shape();
}

export function unknownShape(): Shape<unknown> {
  return new Shape();
}

export function objectShape<S extends PropertyShapes>(shape: S): ObjectShape<S> {
  return new ObjectShape(shape);
}

export function arrayShape<S extends Shape>(shape: S): ArrayShape<S> {
  return new ArrayShape(shape);
}

export function tupleShape<S extends [Shape, ...Shape[]]>(shapes: S): TupleShape<S> {
  return new TupleShape(shapes);
}

export function stringShape(): StringShape {
  return new StringShape();
}

export function numberShape(): NumberShape {
  return new NumberShape();
}

export function literalShape<T extends Primitive>(value: T): LiteralShape<T> {
  return new LiteralShape(value);
}

export function nullShape(): LiteralShape<null> {
  return new LiteralShape(null);
}

export function undefinedShape(): LiteralShape<undefined> {
  return new LiteralShape(undefined);
}

export function enumShape<U extends { [key: string | number]: string | number }>(values: U): EnumShape<U[keyof U]>;

export function enumShape<U extends Primitive, T extends readonly [U, ...U[]]>(values: T): EnumShape<T[number]>;

export function enumShape<U extends Primitive, T extends [U, ...U[]]>(values: T): EnumShape<T[number]>;

export function enumShape(values: any): EnumShape<any> {
  if (Array.isArray(values)) {
    return new EnumShape(values);
  }

  const enumValues = Object.values<Primitive>(values);
  const enumKeys = Object.keys(values);

  for (const key of enumKeys) {
    enumValues.splice(enumValues.indexOf(key), 1);
  }

  return new EnumShape(enumValues);
}

export function recordShape<S extends Shape>(valueShape: S): RecordShape<StringShape, S>;

export function recordShape<K extends Shape<keyof any>, V extends Shape>(keyShape: K, valueShape: V): RecordShape<K, V>;

export function recordShape(keyShape: Shape, valueShape?: Shape) {
  if (valueShape === undefined) {
    valueShape = keyShape;
    keyShape = new StringShape();
  }
  return new RecordShape(keyShape, valueShape);
}

export function lazyShape<S extends Shape>(provider: (value: any) => S): LazyShape<S> {
  return new LazyShape(provider);
}

export function whenShape(predicate: (value: any) => any, shape: Shape): WhenShape {
  return new WhenShape(predicate, shape);
}

const a = objectShape({
  foo: arrayShape(
    objectShape({
      bar: stringShape().pattern(/asd/).nullable(),
      qux: arrayShape(numberShape()).max(3),
    }).and(whenShape(() => true, numberShape()))
  ),
});

enum Foo {
  BAR = 'asd',
  BAZ = 'zxc',
}

const b = objectShape({}).or(stringShape());

const c = stringShape();

type aa = InferType<typeof b>;
//   ^?

type b = InferType<typeof a>;
//   ^?
