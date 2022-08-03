# Doubter 🤔

No-hassle runtime type validation and parsing.

- [High performance and low memory consumption](#performance);
- [Just 4 kB gzipped](https://bundlephobia.com/result?p=doubter) and tree-shakable.

```shell
npm install --save-prod doubter
```

- [Usage](#usage)

    - Arrays<br>
      [`array`](#array)
      [`tuple`](#tuple)

    - Objects<br>
      [`object`](#object)
      [`record`](#record)
      [`instanceOf`](#instanceof)

    - Numbers<br>
      [`number`](#number)
      [`integer`](#integer)
      [`bigint`](#bigint)

    - Strings<br>
      [`string`](#string)

    - Booleans<br>
      [`boolean`](#boolean)

    - Literal values<br>
      [`literal`](#literal)
      [`oneOf`](#oneof)

    - Unconstrained values<br>
      [`any`](#any)
      [`unknown`](#unknown)

    - Prohibited values<br>
      [`never`](#never)

    - Optional values<br>
      [`optional`](#optional)
      [`nullable`](#nullable)
      [`nullish`](#nullish)

    - Type composition<br>
      [`or`](#or)

    - Recursive types<br>
      [`lazy`](#lazy)

- [Performance](#performance)

# Usage

Doubter provides a DSL API to compose a runtime type definition that can be used to validate arbitrary data.

```ts
import * as d from 'doubter';

const myType = d.object({
  name: d.string().min(1),
  age: d.number().min(18).max(100)
});
```

Infer the type from the definition:

```ts
import { InferType } from 'doubter';

type MyType = InferType<typeof myType>;
// → Type<{ name: string, age: number }>
```

Validate the value using the type definition:

```ts
myType.validate({ age: 5 });
// → [{path: ['name'], message: 'Must be a string', …}, …]
```

## `array`

Constrains a value to be an array of elements of a given type:

```ts
d.array(d.number());
// → Type<number[]>
```

Constrain the array length limits:

```ts
d.array(d.string()).min(1).max(10);
```

You can limit both minimum and maximum array length at the same time:

```ts
d.array(d.string()).length(5);
```

## `tuple`

Constrains a value to be a tuple where elements at particular positions have concrete types:

```ts
d.tuple([d.string(), d.number()]);
// → Type<[string, number]>
```

## `object`

Constrains a value to be an object with a set of properties:

```ts
d.object({
  foo: d.string(),
  bar: d.number()
});
// → Type<{ foo: string, bar: number }>
```

### Optional properties

If the inferred type of the property is a union with `undefined` then the property becomes optional:

```ts
d.object({
  foo: d.optional(d.string()),
  bar: d.number()
});
// → Type<{ foo?: string | undefined, bar: number }>
```

### Index signature

Add an index signature to the object, so all properties that are not listed explicitly are validated with the indexer
type:

```ts
const type = d.object({
  foo: d.string(),
  bar: d.number()
});

const indexType = d.or([
  d.string(),
  d.number()
]);
// → Type<string | number>

type.index(indexType);
// → Type<{ foo: string bar: number, [key: string]: string | number }>
```

### Unknown keys

Keys that are not defined explicitly can be handled in several ways:

- constrained by the [index signature](#index-signature);
- stripped;
- preserved as is, this is the default behavior;
- prohibited.

You can force an object to have only known keys. If an unknown key is met, a validation issue is raised.

```ts
d.object({
  foo: d.string(),
  bar: d.number()
}).exact();
```

You can strip unknown keys, so the object is cloned and only known keys are preserved.

```ts
d.object({
  foo: d.string(),
  bar: d.number()
}).strip();
```

You can derive a new type and override the strategy for unknown keys:

```ts
const type = d.object({ foo: d.string() }).exact();

// Unknonwn keys are preserved this new type
type.preserve();
```

### Picking and omitting properties

Picking keys from an object creates a new type that contains only listed keys:

```ts
const type = d.object({
  foo: d.string(),
  bar: d.number()
});

type.pick(['foo']);
// → Type<{ foo: string }>
```

Omitting keys of an object creates a new type that contains all keys except listed ones:

```ts
const type = d.object({
  foo: d.string(),
  bar: d.number()
});

type.omit(['foo']);
// → Type<{ bar: number }>
```

### Extending objects

Add new properties to the object type:

```ts
const type = d.object({
  foo: d.string(),
  bar: d.number()
});

type.extend({
  qux: d.boolean()
});
// → Type<{ foo: string, bar: number, qux: boolean }>
```

Merge object types preserving the index signature of the left-hand type:

```ts
const fooType = d.object({
  foo: d.string()
});

const barType = d.object({
  bar: d.number()
});

fooType.extend(barType);
// → Type<{ foo: string, bar: number }>
```

## `record`

Constrains a value to be an object with both keys and values constrained by given types.

```ts
d.record(d.string(), d.number())
// → Type<{ [key: string]: number }>
```

You can pass any type that extends `Type<string>` as a key constraint:

```ts
const keyType = d.or([
  d.literal('foo'),
  d.literal('bar')
]);
// → Type<'foo' | 'bar'>

d.record(keyType, d.number());
// → Type<{ foo: number, bar: number }>
```

## `instanceOf`

Constrains a value to be an object that is an instance of a class:

```ts
class Foo {
  bar: string;
}

d.instanceOf(Foo);
// → Type<Foo>
```

## `number`

Constrains a floating point number.

```ts
number();
// → Type<number>
```

### Minimum and maximum values

You can limit the exclusive `gt` and inclusive `gte` minimum and the exclusive `lt` and inclusive `lte` maximum
values:

```ts
// The number must be greater than 5 and less then of equal to 10
number().gt(0.5).lte(2.5)
// → Type<number>
```

Constrain a number to be a multiple of a divisor:

```ts
// Number must be divisible by 5 without a remainder
number().multipleOf(5);
```

## `integer`

Constrains a value to be an integer. This type inherits [number refinements](#number).

```ts
integer().min(5);
// → Type<number>
```

## `bigint`

Constrains a value to be a `BigInt`.

```ts
bigint();
// → Type<bigint>
```

## `string`

Constrains a value to be string.

```ts
string();
// → Type<string>
```

Constrain the string length limits:

```ts
d.string().min(1).max(10);
```

You can limit both minimum and maximum string length at the same time:

```ts
d.string().length(5);
```

Constrain a string with a regular expression:

```ts
d.string().regex(/foo|bar/);
```

## `boolean`

Constrains a value to be boolean.

```ts
d.boolean();
// → Type<boolean>
```

## `literal`

Constrains a value to be an exact primitive value:

```ts
d.literal('foo');
// → Type<'foo'>
```

## `oneOf`

Constrains a value to be equal to one of the primitive values:

```ts
d.oneOf([1, 'foo', 'bar']);
// → Type<1 | 'foo' | 'bar'>
```

You can use a non-constant enum to limit the possible values:

```ts
enum Foo {
  BAR = 'bar',
  QUX = 'qux'
}

d.oneOf(Foo);
// → Type<Foo>
```

## `any`

An unconstrained value that is inferred as `any`:

```ts
d.any();
// → Type<any>
```

## `unknown`

An unconstrained value that is inferred as `unknown`:

```ts
d.unknown();
// → Type<unknown>
```

## `never`

A type that always raises a validation issue regardless of a value:

```ts
d.never();
// → Type<never>
```

## `optional`

Allows a value to be `undefined`:

```ts
d.optional(d.string());
// → Type<string | undefined>
```

## `nullable`

Allows a value to be `null`:

```ts
d.nullable(d.string());
// → Type<string | null>
```

## `nullish`

Allows a value to be `null` or `undefined`.

```ts
d.nullish(d.string());
// → Type<string | null | undefined>
```

## `or`

A constraint that allows a value to be one of the given types:

```ts
d.or([
  d.string(),
  d.number()
]);
// → Type<string | number>
```

## `lazy`

To create a type that references itself you may need a lazy type definition:

```ts
interface Foo {
  bar: Foo;
}

const fooType: Type<Foo> = d.object({
  bar: d.lazy(() => fooType)
});
// → Type<Foo>
```

Note that type of `fooType` must be explicitly defined to satisfy TypeScript type inference.

# Performance
