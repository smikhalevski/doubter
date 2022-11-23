# Doubter&ensp;🤔&ensp;[![build](https://github.com/smikhalevski/doubter/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/doubter/actions/workflows/master.yml)

No-hassle runtime validation and transformation.

- TypeScript first;
- Sync and async validation and transformation flows;
- [High performance and low memory consumption](#performance);
- [Just 7 kB gzipped](https://bundlephobia.com/result?p=doubter) and tree-shakable;

```ts
import * as d from 'doubter';

const userShape = d.object({
  name: d.string().optional('Anonymous'),
  age: d.int().gte(18).lt(100)
});

type PartialUser = typeof userShape['input'];
// → { age: number }

type User = typeof userShape['output'];
// → { name: string, age: number }

const user = userShape.parse({ age: 21 });
// → { name: 'Anonymous', age: 21 }
```

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/doubter-example-y5kec4)

```shell
npm install --save-prod doubter
```

- [Usage](#usage)

    - [Checks](#checks)
    - [Refinements](#refinements)
    - [Transformations](#transformations)
    - [Redirections](#redirections)
    - [Async shapes](#async-shapes)
    - [Localization](#localization)
    - [Parsing context](#parsing-context)
    - [Integrations](#integrations)

- [API reference](#api-reference)

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
      [`int`](#integer)
      [`bigint`](#bigint)

    - Strings<br>
      [`string`](#string)

    - Booleans<br>
      [`boolean`](#boolean)

    - Promises<br>
      [`promise`](#promise)

    - Literal values<br>
      [`const`](#const)
      [`enum`](#enum)

    - Shape composition<br>
      [`union`](#union)
      [`or`](#union)
      [`intersection`](#intersection)
      [`and`](#intersection)

    - Unconstrained values<br>
      [`any`](#any)
      [`unknown`](#unknown)
      [`never`](#never)

    - Other<br>
      [`preprocess`](#preprocess)
      [`lazy`](#lazy)

- [Performance](#performance)

# Usage

Doubter provides an API to compose runtime shapes that validate and transform data. Shapes can be treated as pipelines
that have an input and an output. The `Shape` type may have zero, one or two parameters.

- `Shape<I, O>` is a shape that has an input of the type `I` and output of the type `O`.
- `Shape<T>` is a shortcut for `Shape<T, T>`.
- `Shape` is a shortcut for `Shape<any, any>`.

For example, consider a shape that ensures that an input value is a string.

```ts
import * as d from 'doubter';

const myShape = d.string();
// → Shape<string>

myShape.parse('foo');
// → 'foo'
```

If an input value isn't a string, a `ValidationError` is thrown.

```ts
myShape.parse(42);
// → throws a ValidationError
```

Each error instance has `issues` property that contains issues that occurred during parsing.

```ts
[{
  code: 'type',
  path: [],
  input: 42,
  message: 'Must be a string',
  param: 'string',
  meta: undefied
}]
```

It isn't always convenient to write a try-catch block to handle a validation error. Use `try` method in such cases.

```ts
myShape.try('foo');
// → { ok: true, value: 'foo' }

myShape.try(42);
// → { ok: false, issues: [{ code: 'type', … }] }
```

Sometimes you don't care about issues at all, and want a default value to be returned if things go south:

```ts
myShape.parseOrDefault('foo');
// → 'foo'

myShape.parseOrDefault(42, 'bar');
// → 'bar'
```

You can infer the input and output types of the shape:

```ts
type MyInput = typeof myShape['input'];

type MyOutput = typeof myShape['output'];
```

## Checks

Checks allow constraining the input value beyond type assertions. For example, if you want to constrain an input number
to be greater than 5:

```ts
const myShape = d.number().check(val => {
  if (val <= 5) {
    return { code: 'woops' };
  }
});
// → Shape<number>

myShape.parse(10);
// → 10

myShape.parse(3);
// → throws a ValidationError
```

A check callback receives an input value and returns an issue or an array of issues if the value isn't valid. If value
is valid, a check callback must return `null` or `undefined`.

Most shapes have a set of built-in checks. The check we've just implemented is called `gt` (greater than):

```ts
d.number().gt(5);
```

You can add as many checks as you want to the shape. They are executed the same order they are defined.

```ts
d.string().min(5).regex(/a/).parse('foo');
```

By default, if a check returned an issue, all consequent checks are ignored. In the example above, a validation error
would be thrown with a single issue:

```ts
[{
  code: 'stringMinLength',
  path: [],
  input: 'foo',
  message: 'Must have the minimum length of 5',
  param: 'string',
  meta: undefied
}]
```

If you want a check to be executed even if the previous check failed, pass the `unsafe` option.

```ts
d.string().min(5).regex(/bar/, { unsafe: true }).parse('foo', { verbose: true });
```

This would throw a validation error with the following issues.

```ts
[
  {
    code: 'stringMinLength',
    path: [],
    input: 'foo',
    message: 'Must have the minimum length of 5',
    param: 'string',
    meta: undefied
  },
  {
    code: 'stringRegex',
    path: [],
    input: 'foo',
    message: 'Must regex the pattern /bar/',
    param: /bar/,
    meta: undefied
  },
]
```

Doubter halts parsing and raises an error as soon as the first issue was encountered. Sometimes you may want to collect
all issues that prevent input from being successfully parsed. To do this, pass a `verbose` option as seen in the example
above.

At this point you may be wondering what is that `meta` field of the issue object anyway? You can pass a `meta` option to
any built-in check, and it would be added to an issue.

```ts
d.number().gt(5, { meta: 'Any useful data here' });
```

## Refinements

Refinements are a simplified checks that use a predicate to validate an input. For example, the shape below would raise
an issue if the input string is less than three characters long.

```ts
d.string().refine(val => val.length >= 3)
// → Shape<string>
```

You can also use refinements to [narrow](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) the output type
of the shape:

```ts
d.string().refine((val): val is 'foo' | 'bar' => val === 'foo' || val === 'bar')
// → Shape<string, 'foo' | 'bar'>
```

## Transformations

Shapes can transform values. Let's consider a shape that takes a string as an input and converts it to number.

```ts
const myShape = d.string().transform(val => parseInt(val, 10));
// → Shape<string, number>
```

This shape ensures that the input value is a string and passes it to a transformation callback.

```ts
myShape2.parse('42');
// → 42
```

You can throw `ValidationError` inside the transformation callback to notify parser that transformation cannot be
successfully completed:

```ts
d.string().transform(val => {
  const output = parseInt(val, 10);

  if (isNaN(output)) {
    throw new d.ValidationError([{ code: 'woops' }]);
  }
  return output;
})
```

## Redirections

Redirections allow you to apply a shape to the output of another shape.

```ts
const myShape1 = d.string().transform(val => parseFloat(val));
// → Shape<string, number>

const muShape2 = myShape1.to(number().lt(5).gt(10));
// → Shape<string, number>
```

Redirections are particularly useful along with transformations since the `transform` method returns a `TransformShape`
instance that has a generic API.

## Async shapes

Most of the time your shapes would be sync. But some transformations or promise values would make them async.

Let's consider the sync transformation:

```ts
const syncShape1 = d.string().transform(val => 'Hello, ' + val);
// → Shape<string>

syncShape1.async;
// → false

syncShape1.parse('Jill');
// → 'Hello, Jill'
```

The transformation callback receives and returns a string and so does `syncShape1`.

Now lets return a promise from the transformation callback:

```ts
const syncShape2 = d.string().transform(val => Promise.resolve('Hello, ' + val));
// → Shape<string, Promise<string>>

syncShape2.async;
// → false

syncShape2.parse('Jill');
// → Promise<string>
```

Notice that `syncShape2` is asymmetric: it expects a string input and transforms it to a `Promise<string>`. `syncShape2`
is still sync, since the transformation callback _synchronously wraps_ a value in a promise.

Now let's create an async shape using the async transformation:

```ts
const asyncShape = d.string().transformAsync(val => Promise.resolve('Hello, ' + val));
// → Shape<string>

asyncShape.async;
// → true

await syncShape2.parseAsync('Jill');
// → 'Hello, Jill'
```

Notice that `asyncShape` still transforms the input string value to output string but the transformation itself is
async.

The shape is async if it uses async transformations. Here's an async object shape:

```ts
const objShape1 = d.object({
  foo: d.string().transformAsync(val => Promise.resolve(val))
});
// → Shape<{ foo: string }>

objShape1.async;
// → true
```

Shape also becomes async if it relies on a [`promise`](#promise) shape:

```ts
const objShape2 = d.object({
  foo: d.promise(d.string())
});
// → Shape<{ foo: Promise<string> }>
```

## Localization

All shapes and built-in checks support custom messages:

```ts
d.string('Hey, string here').min(3, 'Too short');
```

Checks that have a param, such as `min` constraint in the example above, can use a `%s` placeholder that would be
interpolated with the param value.

```ts
d.string().min(3, 'Minimum length is %s');
```

You can pass a function as a message, then it would receive a check param, an issue code, an input value, a metadata,
and parsing options and should return a formatted message value. The returned formatted message can be of any type.

For example, when using with React you may return a JSX element:

```tsx
d.number().gt(5, (param, code, input, meta, options) => (
  <span style={{ color: 'red' }}>
    Minimum length is {param}
  </span>
))
```

All rules described above are applied to the `message` option as well:

```ts
d.string().length(3, { message: 'Expected length is %s' })
```

## Parsing context

Inside check and transform callbacks you can access options passed to the parser:

```ts
const myShape = d.number().transform((val, options) => {
  return new Intl.NumberFormat(options.context.locale).format(val);
});

myShape.parse(1000, { context: { locale: 'en-US' } });
// → '1,000'
```

## Integrations

You can combine Doubter with any predicate library.

```ts
import * as d from 'doubter';
import isEmail from 'validator/lib/isEmail';

const emailShape = d.string().refine(isEmail, 'Must be an email');
// → Shape<string>
```

# API reference

🔎 [API documentation is available here.](https://smikhalevski.github.io/doubter/)

## `any`

An unconstrained value that is inferred as `any`:

```ts
d.any();
// → Shape<any>
```

You can use `any` to create shapes that are unconstrained at runtime but constrained at compile time:

```ts
d.any<{ foo: string }>();
// → Shape<{ foo: string }>
```

You can create a shape that is constrained by the narrowing predicate:

```ts
d.any((val): val is string => typeof val === 'string');
// → Shape<any, string>
```

## `array`

Constrains a value to be an array of arbitrary elements:

```ts
d.array();
// → Shape<any[]>
```

Your can constrain the shape of array elements:

```ts
d.array(d.number());
// → Shape<number[]>
```

Constrain the array length limits:

```ts
d.array(d.string()).min(1).max(10);
```

You can limit both minimum and maximum array length at the same time:

```ts
d.array(d.string()).length(5);
```

You can transform array values during parsing:

```ts
d.array(d.string().transform(parseFloat));
// → Shape<string[], number[]>
```

## `bigint`

Constrains a value to be a `BigInt`.

```ts
d.bigint();
// → Shape<bigint>
```

## `boolean`

Constrains a value to be boolean.

```ts
d.boolean();
// → Shape<boolean>
```

## `const`

Constrains a value to be an exact value:

```ts
d.const('foo');
// → Shape<'foo'>
```

You can use this to define `NaN` constants as well:

```ts
d.const(NaN);
// → Shape<number>
```

## `enum`

Constrains a value to be equal to one of predefined values:

```ts
d.enum([1, 'foo', 'bar']);
// → Shape<1 | 'foo' | 'bar'>
```

You can use a non-constant enum to limit the possible values:

```ts
enum Foo {
  BAR = 'bar',
  QUX = 'qux'
}

d.enum(Foo);
// → Shape<Foo>
```

Or you can use a const object:

```ts
const Foo = {
  BAR: 'bar',
  QUX: 'qux'
} as const;

d.enum(Foo);
// → Shape<'bar' | 'qux'>
```

## `instanceOf`

Constrains a value to be an object that is an instance of a class:

```ts
class Foo {
  bar: string;
}

d.instanceOf(Foo);
// → Shape<Foo>
```

## `integer`

Constrains a value to be an integer.

```ts
d.integer().min(5);
// → Shape<number>

d.int().max(5);
// → Shape<number>
```

This is a shortcut for number shape declaration:

```ts
d.number().integer();
// → Shape<number>
```

## `intersection`

Creates a shape that checks that the input value conforms to all shapes.

```ts
const myShape = d.intersection([
  d.object({
    foo: d.string()
  }),
  d.object({
    bar: d.number()
  })
]);
// → Shape<{ foo: string, bar: string }>
```

You can use a shorter alias `and`:

```ts
const myShape = d.and([
  d.array(d.string()),
  d.array(d.enum(['foo', 'bar']))
]);
// → Shape<Array<'foo' | 'bar'>>
```

When working with objects, [extend objects](#extending-objects) instead of intersecting them whenever possible, since
object shapes are more performant than object intersection shapes.

There's a logical difference between extended and intersected objects. Let's consider two shapes that both contain the
same key:

```ts
const myShape1 = d.object({
  foo: d.string(),
  bar: d.boolean(),
});

const myShape2 = d.object({
  // 🟡 Notice that the type of foo in myShape2 differs from myShape1.
  foo: d.number()
});
```

Object extensions overwrite properties of the left object with properties of the right object:

```ts
const myShape = myShape1.extend(myShape2);
// → Shape<{ foo: number, bar: boolean }>
```

The intersection requires the input value to conform both shapes at the same time, it's no possible since there are no
values that can satisfy the `string | number` type. So the type of property `foo` becomes `never` and no value would be
able to satisfy the resulting intersection shape.

```ts
const myShape = d.and([myShape1, myShape2]);
// → Shape<{ foo: never, bar: boolean }>
```

## `lazy`

Creates the lazy-loaded shape. For example, you can create cyclic shapes:

```ts
type MyType = string | MyType[];

const myShape: Shape<MyType> = d.lazy(() => d.or([d.string, d.array(myShape)]));
```

Note that you must define a shape type explicitly, because it cannot be inferred.

While Doubter supports cyclic types, it doesn't support cyclic data structures. The latter would cause an infinite loop
at runtime.

## `never`

A shape that always raises a validation issue regardless of an input value:

```ts
d.never();
// → Shape<never>
```

## `number`

Constrains a finite and non-`NaN` number.

```ts
d.number();
// → Shape<number>
```

### Minimum and maximum values

You can limit the exclusive `gt` and inclusive `gte` minimum and the exclusive `lt` and inclusive `lte` maximum
values:

```ts
// The number must be greater than 5 and less then of equal to 10
d.number().gt(0.5).lte(2.5)
// → Shape<number>
```

Constrain a number to be a multiple of a divisor:

```ts
// Number must be divisible by 5 without a remainder
d.number().multipleOf(5);
```

You can constrain the number to be an integer:

```ts
d.number().integer();
// Or use a shortcut d.int()
```

The integer check is always applied before any other checks.

If you want to allow `NaN` numbers you can use a union shape:

```ts
d.or([d.number(), d.const(NaN)]);
// → Shape<number>
```

## `object`

Constrains a value to be an object with a set of properties:

```ts
d.object({
  foo: d.string(),
  bar: d.number()
});
// → Shape<{ foo: string, bar: number }>
```

### Optional properties

If the inferred type of the property shape is a union with `undefined` then the property becomes optional:

```ts
d.object({
  foo: d.string().optional(),
  bar: d.number()
});
// → Shape<{ foo?: string | undefined, bar: number }>
```

Or you can define optional properties as a union:

```ts
d.object({
  foo: d.or([d.string(), d.const(undefined)]),
});
// → Shape<{ foo?: string | undefined }>
```

If the transformation result extends `undefined` then the output property becomes optional:

```ts
d.object({
  foo: d.string().transform(val => val === 'foo' ? val : undefined),
});
// → Shape<{ foo: string }, { foo?: string | undefined }>
```

### Index signature

You can add an index signature to the object type, so all properties that aren't listed explicitly are validated with
the rest shape:

```ts
const myShape = d.object({
  foo: d.string(),
  bar: d.number()
});
// → Shape<{ foo: string, bar: number }>

const myRestShape = d.or([
  d.string(),
  d.number()
]);
// → Shape<string | number>

myShape.rest(myRestShape);
// → Shape<{ foo: string, bar: number, [key: string]: string | number }>
```

Unlike an index signature in TypeScript, a rest shape is applied only to keys that aren't explicitly specified among
object property shapes.

### Unknown keys

Keys that aren't defined explicitly can be handled in several ways:

- constrained by the [rest shape](#index-signature);
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

You can strip unknown keys, so the object is cloned if an unknown key is met, and only known keys are preserved.

```ts
d.object({
  foo: d.string(),
  bar: d.number()
}).strip();
```

You can derive the new shape and override the strategy for unknown keys:

```ts
const myShape = d.object({ foo: d.string() }).exact();

// Unknonwn keys are now preserved
myShape.preserve();
```

### Picking and omitting properties

Picking keys from an object creates the new shape that contains only listed keys:

```ts
const myShape1 = d.object({
  foo: d.string(),
  bar: d.number()
});

const myShape2 = myShape1.pick(['foo']);
// → Shape<{ foo: string }>
```

Omitting keys of an object creates the new shape that contains all keys except listed ones:

```ts
const myShape = d.object({
  foo: d.string(),
  bar: d.number()
});

myShape.omit(['foo']);
// → Shape<{ bar: number }>
```

### Extending objects

Add new properties to the object shape:

```ts
const myShape = d.object({
  foo: d.string(),
  bar: d.number()
});

myShape.extend({
  qux: d.boolean()
});
// → Shape<{ foo: string, bar: number, qux: boolean }>
```

Merging object shapes preserves the index signature of the left-hand shape:

```ts
const myFooShape = d.object({
  foo: d.string()
}).rest(d.or([d.string(), d.number()]));

const myBarShape = d.object({
  bar: d.number()
});

myFooShape.extend(myBarShape);
// → Shape<{ foo: string, bar: number, [key: string]: string | number }>
```

### Making objects partial and required

Object properties are optional if their type extends `undefined`. You can derive an object shape that would have its
properties all marked as optional:

```ts
const myShape = d.object({
  foo: d.string(),
  bar: d.number()
});

myShape.partial()
// → Shape<{ foo?: string | undefined, bar?: number | undefined }>
```

You can specify which fields should be marked as optional:

```ts
const myShape = d.object({
  foo: d.string(),
  bar: d.number()
});

myShape.partial(['foo'])
// → Shape<{ foo?: string | undefined, bar: number }>
```

In the same way, properties that are optional can be made required:

```ts
const myShape = d.object({
  foo: d.string().optional(),
  bar: d.number()
});

myShape.required(['foo'])
// → Shape<{ foo: string, bar: number }>
```

Note that `required` would force the value of both input and output to be non-`undefined`.

## `promise`

A shape that applies another shape to the resolved value of a `Promise`.

```ts
d.promise(d.string());
// → Shape<Promise<string>>
```

You can transform the value inside a promise:

```ts
const myShape = d.promise(d.string().transform(parseFloat));
// → Shape<Promise<string>, Promise<number>>
```

Promise shapes don't support sync parsing, so `tryAsync`, `parseAsync` or `parseOrDefaultAsync` should be used:

```ts
await myShape.parseAsync('42');
// → 42
```

## `preprocess`

Preprocesses the input value. Useful for input value coercion:

```ts
const myShape = d.preprocess(parseFloat);
// → Shape<string, number>
```

You can use `preprocess` in conjunction with [redirection](#redirections):

```ts
myShape.to(d.number().min(3).max(5));
```

## `record`

Constrain values of a dictionary-like object:

```ts
d.record(d.number())
// → Shape<Record<string, number>>
```

Constrain both keys and values of a dictionary-like object:

```ts
d.record(d.string(), d.number())
// → Shape<Record<string, number>>
```

You can pass any shape that extends `Shape<string>` as a key constraint:

```ts
const myKeyShape = d.enum(['foo', 'bar']);
// → Shape<'foo' | 'bar'>

d.record(myKeyShape, d.number());
// → Shape<Record<'foo' | 'bar', number>>
```

You can rename record keys using transformation:

```ts
const myKeyShape = d.enum(['foo', 'bar']).transform(val => {
  return val.toUpperCase() as Uppercase<typeof val>;
});
// → Shape<'foo' | 'bar', 'FOO' | 'BAR'>

const myShape = d.record(myKeyShape, d.number());
// → Shape<Record<'foo' | 'bar', number>, Record<'FOO' | 'BAR', number>>

myShape.parse({ foo: 1, bar: 2 });
// → { FOO: 1, BAR: 2 }
```

## `string`

Constrains a value to be string.

```ts
d.string();
// → Shape<string>
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

## `tuple`

Constrains a value to be a tuple where elements at particular positions have concrete types:

```ts
d.tuple([d.string(), d.number()]);
// → Shape<[string, number]>
```

Specify a rest tuple elements:

```ts
d.tuple([d.string(), d.number()], d.boolean());
// → Shape<[string, number, ...boolean]>
```

## `union`

A constraint that allows a value to be one of the given types:

```ts
d.union([d.string(), d.number()]);
// → Shape<string | number>
```

You can use a shorter alias `or`:

```ts
d.or([d.string(), d.number()]);
```

## `unknown`

An unconstrained value that is inferred as `unknown`:

```ts
d.unknown();
// → Shape<unknown>
```

# Performance

Clone this repo and use `npm ci && npm run perf -- -t 'overall'` to run the performance testsuite.

![Parsing performance chart](./images/perf.svg)
