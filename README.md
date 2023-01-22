# Doubter&ensp;🤔&ensp;[![build](https://github.com/smikhalevski/doubter/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/doubter/actions/workflows/master.yml)

No-hassle runtime validation and transformation.

- TypeScript first;
- Zero dependencies;
- Sync and async validation and transformation flows;
- Type coercion;
- [High performance and low memory consumption](#performance);
- [Just 10 kB gzipped](https://bundlephobia.com/result?p=doubter) and tree-shakable;

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/doubter-example-y5kec4)

```shell
npm install --save-prod doubter
```

- **Core features**

    - [Basics](#basics)
    - [Shapes](#shapes)
    - [Parsing and trying](#parsing-and-trying)
    - [Validation errors](#validation-errors)
    - [Checks](#checks)
    - [Refinements](#refinements)
    - [Transformations](#transformations)
    - [Parsing context](#parsing-context)
    - [Localization](#localization)
    - [Type coercion](#type-coercion)
    - [Branded types](#branded-types)
    - [Shape piping](#shape-piping)
    - [Exclude](#exclude)
    - [Include](#include)
    - [Replace](#replace)
    - [Optional and non-optional](#optional-and-non-optional)
    - [Nullable and nullish](#nullable-and-nullish)
    - [Fallback on error](#fallback-on-error)
    - [Guarded functions](#guarded-functions)
    - [Integrations](#integrations)

- **Data types**

    - Arrays<br>
      [`array`](#array)
      [`tuple`](#tuple)

    - Objects<br>
      [`object`](#object)
      [`record`](#record)
      [`instanceOf`](#instanceof)
      [`set`](#set)
      [`map`](#map)

    - Numbers<br>
      [`number`](#number)
      [`integer`](#integer)
      [`int`](#integer)
      [`nan`](#nan)
      [`bigint`](#bigint)

    - Strings<br>
      [`string`](#string)

    - Booleans<br>
      [`boolean`](#boolean)

    - Symbols<br>
      [`symbol`](#symbol)

    - Dates<br>
      [`date`](#date)

    - Literal values<br>
      [`enum`](#enum)
      [`const`](#const)
      [`null`](#null)
      [`undefined`](#undefined)
      [`void`](#void)

    - Promises<br>
      [`promise`](#promise)

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
      [`transform`](#transform)
      [`lazy`](#lazy)
      [`json`](#json)

# Basics

Let's create a simple shape of a user object:

```ts
import * as d from 'doubter';

const userShape = d.object({
  name: d.string(),
  age: d.int().gte(18).lt(100)
});
// ⮕ Shape<{ username: string, age: number }>
```

This shape can be used to validate a value:

```ts
userShape.parse({
  name: 'John Belushi',
  age: 30,
});
// ⮕ { name: 'John Belushi', age: 31 }
```

If an incorrect value is provided, a validation error is thrown:

```ts
userShape.parse({
  name: 'Peter Parker',
  age: 17,
});
// ❌ ValidationError: numberGreaterThanOrEqual at /age: Must be greater than or equal to 18
```

Infer user type from the shape:

```ts
type User = typeof userShape['output'];

const user: User = {
  name: 'Dan Aykroyd',
  age: 27,
};
```

# Shapes

Shapes are validation and transformation pipelines that have an input and an output. Here's a shape that restricts an
input to a string and produces a string as an output:

```ts
d.string();
// ⮕ Shape<string>
```

Shapes can have different input and output types. For example, the shape below allows strings and replaces `undefined`
input values with a default value "Mars":

```ts
const shape = d.string().optional('Mars');
// ⮕ Shape<string | undefined, string>

shape.parse('Pluto');
// ⮕ 'Pluto'

shape.parse(undefined);
// ⮕ 'Mars'
```

Infer the input and output types of the shape:

```ts
const shape = d.string().optional('Mars');
// ⮕ Shape<string | undefined, string>

type ShapeInput = typeof shape['input'];
// ⮕ string | undefined

type ShapeOutput = typeof shape['output'];
// ⮕ string
```

## Async shapes

[Transformations](#transformations) and reliance on [promise shapes](#promise) make your shapes async. Here's a shape of
a promise that is expected to be fulfilled with a number:

```ts
const asyncShape = d.promise(d.number());
// ⮕ Shape<Promise<number>>
```

You can check that the shape is async:

```ts
asyncShape.async // ⮕ true
```

Async shapes don't support synchronous `parse` method, and would throw an error if it is called:

```ts
asyncShape.parse(Promise.resolve(42));
// ❌ Error: Shape is async
```

Use `parseAsync` with async shapes instead:

```ts
asyncShape.parseAsync(Promise.resolve(42));
// ⮕ Promise<42>
```

Any shape that relies on an async shape becomes async as well:

```ts
const otherShape = d.object({
  foo: asyncShape,
});
// ⮕ Shape<{ foo: Promise<number> }>

otherShape.async // ⮕ true
```

# Parsing and trying

Each shape can parse input values and provides several methods for that purpose.

## `parse`

You're already familiar with `parse` that takes an input value and returns an output value or throws a validation error
is parsing fails:

```ts
const shape = d.number();
// ⮕ Shape<number>

shape.parse(42);
// ⮕ 42

shape.parse('Mars');
// ❌ ValidationError: type at /: Must be a number
```

`parseAsync` works the same way but returns a promise that is eiter fulfilled with an output value or rejects with a
validation error.

## `parseOrDefault`

Sometimes you don't care about validation errors, and want a default value to be returned if things go south:

```ts
const shape = d.number();
// ⮕ Shape<number>

shape.parseOrDefault(42);
// ⮕ 42

shape.parseOrDefault('Mars');
// ⮕ undefined

shape.parseOrDefault('Pluto', 5.3361);
// ⮕ 5.3361
```

`parseOrDefaultAsync` has the same semantics and returns a promise.

## `try`

It isn't always convenient to write a try-catch blocks to handle a validation errors. Use `try` method in such cases:

```ts
const shape = d.number();
// ⮕ Shape<number>

shape.try(42);
// ⮕ { ok: true, value: 42 }

shape.try('Mars');
// ⮕ { ok: false, issues: [{ code: 'type', … }] }
```

`tryAsync` has the same semantics and returns a promise.

# Validation errors

Validation errors which are thrown by the `parse` method, and `Err` objects returned by the `try` method have an
`issues` property which holds an array of validation issues:

```ts
const shape = d.object({
  age: d.number()
});
// ⮕ Shape<{ age: number }>

const result = shape.try({ age: 'Seventeen' });
// ⮕ { ok: false, issues: … }
```

In the example above `result.issues` would contain a single issue:

```ts
[{
  code: 'type',
  path: ['age'],
  input: 'Seventeen',
  message: 'Must be a number',
  param: 'number',
  meta: undefied
}]
```

`code` is a code of the validation issue. Shapes provide [various checks](#checks) and each check has a unique code.
In the example above, `type` code refers to a failed number type check. See the table of known codes below.

`path` is the object path, an array that may contain strings, numbers (for array indices and such), symbols, and any
other values since they can be `Map` keys.

`input` is the input value that caused a validation issue. Note that if coercion is enabled this contains a coerced
value.

`message` is the human-readable issue message. Refer to [Localization](#localization) section for more details.

`param` is the parameter value associated with the issue. Parameter value usually depends on `code`, see the table
below.

`meta` is the optional metadata associated with the issue. Refer to [Metadata](#metadata) section for more details.

| Code | Caused by | Param |
| :-- | :-- | :-- |
| `arrayMinLength` | `d.array().min(n)` | The minimum length `n` |
| `arrayMaxLength` | `d.array().max(n)` | The maximum length `n` |
| `const` | `d.const(x)` | The expected constant value `x` |
| `enum` | `d.enum([x, y, z])` | The list of unique expected values`[x, y, z]` |
| `exclusion` | [`shape.exclude(x)`](#exclude) | The excluded value `x` |
| `instance` | `instanceOf(Class)` | The class constructor `Class` |
| `intersection` | `d.and(…)` | — |
| `json` | `d.json()` | The message from `JSON.parse()` |
| `predicate` | [`shape.refine(…)`](#refinements) | The callback passed to `refine`  |
| `numberInteger` | `d.integer()` | — |
| `numberFinite` | `d.number().finite()` | — |
| `numberGreaterThan` | `d.number().gt(x)` | The exclusive minimum value `x` |
| `numberGreaterThanOrEqual` | `d.number().gte(x)` | The minimum value `x` |
| `numberLessThan` | `d.number().lt(x)` | The exclusive maximum value `x` |
| `numberLessThanOrEqual` | `d.number().lte(x)` | The maximum value `x` |
| `numberMultipleOf` | `d.number().multipleOf(x)` | The divisor `x` |
| `setMinSize` | `d.set().min(n)` | The minimum size `n` |
| `setMaxSize` | `d.set().max(n)` | The maximum size `n` |
| `stringMinLength` | `d.string().min(n)` | The minimum length `n` |
| `stringMaxLength` | `d.string().max(n)` | The maximum length `n` |
| `stringRegex` | `d.string().regex(re)` | The regular expression `re` |
| `type` | All shapes | The expected input value type [<sup>✱</sup>](#value-types) |
| `tuple` | `d.tuple([…])` | The expected tuple length |
| `union` | `d.or(…)` | The array of expected input value types |
| `unknownKeys` | `d.object().exact()` | The array of unknown keys |

<a href="#value-types" name="value-types"><sup>✱</sup></a> The list of known value types:

- `array`
- `bigint`
- `boolean`
- `date`
- `function`
- `object`
- `map`
- `never`
- `null`
- `number`
- `promise`
- `set`
- `string`
- `symbol`
- `undefined`

# Checks

Checks allow constraining the input value beyond type assertions. For example, if you want to constrain an input number
to be greater than 5:

```ts
const shape = d.number().check(value => {
  if (value <= 5) {
    return { code: 'kaputs' };
  }
});
// ⮕ Shape<number>

shape.parse(10);
// ⮕ 10

shape.parse(3);
// ❌ ValidationError: kaputs at /
```

A check callback receives an input value and returns a partial issue or an array of partial issues if the value is
invalid.

Check callbacks can safely throw a `ValidationError` to notify Doubter that parsing issues occurred. While this has the
same effect as returning an array of issues, it is recommended to throw a `ValidationError` as the last resort since
catching errors has a high performance penalty.

If value is valid, a check callback must return `null` or `undefined`.

Most shapes have a set of built-in checks. The check we've just implemented is called `gt` (greater than):

```ts
d.number().gt(5);
```

Add as many checks as you need to the shape. They are executed the same order they are defined.

```ts
d.string().max(4).regex(/a/).parse('Pluto');
```

In the example above, a validation error would be thrown with a single issue:

```ts
[{
  code: 'stringMaxLength',
  path: [],
  input: 'Pluto',
  message: 'Must have the maximum length of 4',
  param: 4,
  meta: undefied
}]
```

If you want a check to be executed even if the previous check failed, pass the `unsafe` option.

```ts
d.string()
  .max(4)
  .regex(/a/, { unsafe: true })
  .parse('Pluto', { verbose: true });
```

This would throw a validation error with following issues:

```ts
[
  {
    code: 'stringMaxLength',
    path: [],
    input: 'Pluto',
    message: 'Must have the maximum length of 4',
    param: 4,
    meta: undefied
  },
  {
    code: 'stringRegex',
    path: [],
    input: 'Pluto',
    message: 'Must regex the pattern /a/',
    param: /a/,
    meta: undefied
  },
]
```

Doubter halts parsing and raises a validation error as soon as the first issue was encountered. Sometimes you may want
to collect all issues that prevent input from being successfully parsed. To do this, pass a `verbose` option as seen in
the example above.

## Metadata

You may be wondering what is the `meta` property of the issue object? Pass a `meta` option to any built-in check, and it
would be added to an issue.

```ts
const shape = d.number().gt(5, { meta: 'Useful data' });
// ⮕ Shape<number>

const result = shape.try(2);
// ⮕ { ok: false, issues: … }

if (!result.ok) {
  result.issues[0].meta // ⮕ 'Useful data'
}
```

This comes handy if you want to enhance an issue with additional data that can be used during issues post-processing,
such as [localization](#localization).

# Refinements

Refinements are a simplified checks that use a predicate to validate an input. For example, the shape below would raise
an issue if the input string is less than three characters long.

```ts
d.string().refine(value => value.length >= 3);
// ⮕ Shape<string>
```

Use refinements to [narrow](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) the output type of the shape:

```ts
function isMarsOrPluto(value: string): 'Mars' | 'Pluto' {
  return value === 'Mars' || value === 'Pluto';
}

d.string().refine(isMarsOrPluto)
// ⮕ Shape<string, 'Mars' | 'Pluto'>
```

# Transformations

Along with validation, shapes can transform values. Let's consider a shape that takes a string as an input and converts
it to number:

```ts
const shape = d.string().transform(parseFloat);
// ⮕ Shape<string, number>
```

This shape ensures that the input value is a string and passes it to a transformation callback:

```ts
shape.parse('42');
// ⮕ 42

shape.parse('Seventeen');
// ⮕ NaN
```

Throw a `ValidationError` inside the transformation callback to notify parser that transformation cannot be successfully
completed:

```ts
function toNumber(input: string): number {
  const output = parseFloat(input);

  if (isNaN(output)) {
    throw new d.ValidationError([{ code: 'kaputs' }]);
  }
  return output;
}

const shape = d.string().transform(toNumber);

shape.parse('42');
// ⮕ 42

shape.parse('Seventeen');
// ❌ ValidationError: kaputs at /
```

## Async transformations

Let's consider a _sync_ transformation:

```ts
const shape1 = d.string().transform(
  value => 'Hello, ' + value
);
// ⮕ Shape<string>

shape1.async;
// ⮕ false

shape1.parse('Jill');
// ⮕ 'Hello, Jill'
```

The transformation callback receives and returns a string and so does `shape1`.

Now lets return a promise from the transformation callback:

```ts
const shape2 = d.string().transform(
  value => Promise.resolve('Hello, ' + value)
);
// ⮕ Shape<string, Promise<string>>

shape2.async;
// ⮕ false

shape2.parse('Jill');
// ⮕ Promise<string>
```

Notice that `shape2` is asymmetric: it expects a string input and transforms it to a `Promise<string>`. `shape2` is
still sync, since the transformation callback _synchronously wraps_ a value in a promise.

Now let's create an async shape using the async transformation:

```ts
const asyncShape1 = d.string().transformAsync(
  value => Promise.resolve('Hello, ' + value)
);
// ⮕ Shape<string>

// 🟡 Notice that the shape is async
asyncShape1.async;
// ⮕ true

await asyncShape1.parseAsync('Jill');
// ⮕ 'Hello, Jill'
```

Notice that `asyncShape1` still transforms the input string value to output string but the transformation itself is
async.

A shape is async if it uses async transformations. Here's an async object shape:

```ts
const asyncShape2 = d.object({
  foo: d.string().transformAsync(
    value => Promise.resolve(value)
  )
});
// ⮕ Shape<{ foo: string }>

asyncShape2.async;
// ⮕ true
```

Shape also becomes async if it relies on a [`promise`](#promise) shape:

```ts
d.object({
  foo: d.promise(d.string())
});
// ⮕ Shape<{ foo: Promise<string> }>
```

# Parsing context

Inside [check](#checks) and [transform](#transformations) callbacks you can access options passed to the parser. The
`context` option may store arbitrary data. By default, context is `undefined`.

The example below shows how you can transform numbers to formatted strings using context:

```ts
const shape = d.number().transform(
  (value, options) => new Intl.NumberFormat(options.context.locale).format(value)
);
// ⮕ Shape<number, string>

shape.parse(
  1000,
  {
    // 🟡 Pass a context during parsing
    context: { locale: 'en-US' }
  }
);
// ⮕ '1,000'
```

# Shape piping

With shape piping you to can pass the shape output to another shape.

```ts
const shape1 = d.string().transform(parseFloat);
// ⮕ Shape<string, number>

const shape2 = shape1.to(number().lt(5).gt(10));
// ⮕ Shape<string, number>
```

Piping is particularly useful in conjunction with transformations and JSON. The example below shows how you can
parse input JSON string and ensure that the output is an object:

```ts
const shape3 = d.json().to(
  d.object({ foo: d.bigint() }).coerce()
);

shape3.parse('{"foo":"6889063"}');
// ⮕ { foo: BigInt(6889063) }
```

# Exclude

Consider the enum shape:

```ts
const shape1 = d.enum(['Mars', 'Pluto', 'Jupiter']);
// ⮕ Shape<'Mars' | 'Pluto' | 'Jupiter'>
```

To exclude a value from this enum you can use `exclude`:

```ts
shape1.exclude('Pluto');
// ⮕ Shape<'Mars' | 'Jupiter'>
```

This works with any shape. For example, you can exclude a number:

```ts
const shape2 = d.number().exclude(42);
// ⮕ Shape<number>

shape2.parse(33);
// ⮕ 33

shape2.parse(42);
// ❌ ValidationError: exclusion at /: Must not be equal to 42
```

Exclude prohibits value at _both input and output_:

```ts
const shape3 = d.number().transform(value => value * 2).exclude(42);
// ⮕ Shape<number>

shape3.parse(21);
// ❌ ValidationError: exclusion at /: Must not be equal to 42
```

# Include

You can include a value in multitude of input values:

```ts
d.const('Mars').include('Pluto');
// ⮕ Shape<'Mars' | 'Pluto'>
```

Included values don't go through checks and transformations of the underlying shape:

```ts
const shape = d.number().gt(3).include('Seventeen');
// ⮕ Shape<number | 'Seventeen'>

shape.parse(2);
// ❌ ValidationError: numberGreaterThan at /: Must be greater than 3

shape.parse(100);
// ⮕ Shape<100>

// 🟡 Notice that parsed value doesn't satisfy the number type constraint
shape.parse('Seventeen');
// ⮕ 'Seventeen'
```

# Replace

Include a value as an input and replace it with another value on the output side:

```ts
const shape = d.const('Mars').replace('Pluto', 'Jupiter');
// ⮕ Shape<'Mars' | 'Pluto', 'Mars' | 'Jupiter'>

shape.parse('Mars');
// ⮕ 'Mars'

shape.parse('Pluto');
// ⮕ 'Jupiter'
```

Note that `replace` treats passed values as literals but in TypeScript type system not all values can be literals. For
example, there's no literal type for `NaN` which may cause unexpected result:

```ts
// 🔴 Note that the shape output is typed 0
d.number().replace(NaN, 0);
// ⮕ Shape<number, 0>
```

Why is output inferred as 0 and not as a `number`? This occurs because `typeof NaN` is `number` and it is excluded from
the output type of the shape. For this particular case use `nan` method of number shape:

```ts
// 🟡 Note that the shape output is a number
const shape = d.number().nan(0);
// ⮕ Shape<number>

shape.parse(NaN);
// ⮕ 0
```

# Optional and non-optional

Marking a shape as optional allows `undefined` in both its input and output:

```ts
d.string().optional();
// ⮕ Shape<string | undefined>
```

You can provide a default value of any type, so it would be used as an output if input value is `undefined`:

```ts
d.string().optional(42);
// ⮕ Shape<string | undefined, string | 42>
```

You can achieve the same behaviour as `optional` using a union:

```ts
d.or([
  d.string(),
  d.undefined()
]);
// ⮕ Shape<string | undefined>
```

You can mark any shape as non-optional which effectively [excludes](#exclude) `undefined` values from both input and
output. For example, lets consider a union of optional string and number:

```ts
const shape1 = d.or([
  d.string().optional(),
  d.number()
]);
// ⮕ Shape<string | undefined | number>

shape1.parse(undefined);
// ⮕ undefined
```

Now let's mark this shape as non-optional:

```ts
const shape2 = shape1.nonOptional();
// ⮕ Shape<string | number>

shape2.parse(undefined);
// ❌ ValidationError: exclusion at /: Must not be equal to undefined
```

# Nullable and nullish

Marking a shape as nullable allows `null` for both input and output:

```ts
d.string().nullable();
// ⮕ Shape<string | null>
```

You can provide a default value, so it would be used as an output if input value is `null`:

```ts
d.string().nullable(42);
// ⮕ Shape<string | null, string | 42>
```

To allow both `null` and `undefined` values an input use `nullish`:

```ts
d.string().nullish();
// ⮕ Shape<string | null | undefined>
```

`nullish` also supports the default value:

```ts
d.string().nullish(8080);
// ⮕ Shape<string | null | undefined, string | 8080>
```

# Fallback on error

If issues were detected during parsing a shape can return a fallback value.

```ts
const shape1 = d.string().catch('Mars');

shape1.parse('Pluto');
// ⮕ 'Pluto'

shape1.parse(42);
// ⮕ 'Mars'
```

Pass a callback as a fallback value, it would be executed every time the catch clause is reached:

```ts
const shape2 = d.number().catch(Date.now);

shape2.parse(42)
// ⮕ 42

shape2.parse('Pluto');
// ⮕ 1671565311528

shape2.parse('Mars');
// ⮕ 1671565326707
```

# Localization

All shapes factories and built-in checks support custom messages:

```ts
d.string('Hey, string here').min(3, 'Too short');
```

Checks that have a param, such as `min` constraint in the example above, can use a `%s` placeholder that would be
interpolated with the param value.

```ts
d.string().min(3, 'Minimum length is %s');
```

Pass a function as a message, and it would receive a check param, an [issue code](#validation-errors), an input value,
[a metadata](#metadata), and parsing options and should return a formatted message value. The returned formatted message
can be of any type.

For example, when using with React you may return a JSX element:

```tsx
d.number().gt(
  5,
  (param, code, input, meta, options) => (
    <span style={{ color: 'red' }}>
      Minimum length is {param}
    </span>
  )
);
```

All rules described above are applied to the `message` option as well:

```ts
d.string().length(3, { message: 'Expected length is %s' })
```

# Integrations

How to validate an email or UUID? Combine Doubter with your favourite predicate library:

```ts
import * as d from 'doubter';
import isEmail from 'validator/lib/isEmail';

const emailShape = d.string().refine(isEmail, 'Must be an email');
// ⮕ Shape<string>

emailShape.parse('Not an email');
// ❌ ValidationError: predicate at /: Must be an email
```

# Guarded functions

Returns a function which parses arguments using provided shapes:

```ts
const callback = d.fn([d.string(), d.boolean()], (arg1, arg2) => {
  // arg1 is string
  // arg2 is boolean
});
```

Or check all arguments with a shape that parses arrays:

```ts
const callback = d.fn(d.array(d.string()), (...args) => {
  // args is string[]
});
```

Or if you have a single non-array argument, you can pass its shape:

```ts
const callback = d.fn(d.string(), arg => {
  // arg is string
});
```

To guard multiple functions omit the callback parameter and a factory function would be returned:

```ts
const callbackFactory = d.fn(d.string());

const callback = callbackFactory(arg => {
  // arg is string
});
```

If you are want to use async shapes to parse arguments, use `fnAsync` which has the same signatures as `fn`.

# Data types

🔎 [API documentation is available here.](https://smikhalevski.github.io/doubter/)

## `any`

An unconstrained value that is inferred as `any`:

```ts
d.any();
// ⮕ Shape<any>
```

Use `any` to create shapes that are unconstrained at runtime but constrained at compile time:

```ts
d.any<{ foo: string }>();
// ⮕ Shape<{ foo: string }>
```

Create a shape that is constrained by the narrowing predicate:

```ts
d.any((value): value is string => typeof value === 'string');
// ⮕ Shape<any, string>
```

## `array`

Constrains a value to be an array of arbitrary elements:

```ts
d.array();
// ⮕ Shape<any[]>
```

Constrain the shape of array elements:

```ts
d.array(d.number());
// ⮕ Shape<number[]>
```

Constrain the length of an array:

```ts
d.array(d.string()).min(1).max(10);
```

Limit both minimum and maximum array length at the same time:

```ts
d.array(d.string()).length(5);
```

Transform array values during parsing:

```ts
d.array(d.string().transform(parseFloat));
// ⮕ Shape<string[], number[]>
```

### Type coercion

If an input value isn't an array then it is implicitly wrapped in an array:

```ts
const shape = d.array(d.string()).coerce()
// ⮕ Shape<string[]>

shape.parse('Pluto');
// ⮕ ['Pluto']
```

## `bigint`

Constrains a value to be a bigint.

```ts
d.bigint();
// ⮕ Shape<bigint>
```

### Type coercion

- `null` and `undefined` → `0n`
- `false` → `0n`
- `true` → `1n`
- Number and string `x` → `BigInt(x)`
- Array `[x]` → `x`, rules are recursively applied to `x`

```ts
const shape = d.bigint().coerce();

shape.parse(null);
// ⮕ 0n

shape.parse(['42']);
// ⮕ 42n

shape.parse('Mars');
// ❌ Error
```

No implicit rounding is performed during coercion:

```ts
d.bigint().coerce().parse('3.14');
// ❌ Error
```

## `boolean`

Constrains a value to be boolean.

```ts
d.boolean();
// ⮕ Shape<boolean>
```

### Type coercion

- `null` and `undefined` → `false`
- `'false'` → `false`
- `'true'` → `true`
- `0` → `false`
- `1` → `true`
- Array `[x]` → `x`, rules are recursively applied to `x`

```ts
const shape = d.boolean().coerce();

shape.parse(1);
// ⮕ true

shape.parse(['false']);
// ⮕ false
```

## `const`

Constrains a value to be an exact value:

```ts
d.const('foo');
// ⮕ Shape<'foo'>
```

There are shortcuts for [`null`](#null), [`undefined`](#undefined) and [`nan`](#nan) constants.

## `date`

Constrains a value to be a valid date.

```ts
d.date();
// ⮕ Shape<Date>
```

### Type coercion

- Number and string `x` → `new Date(x)`
- Array `[x]` → `x`, rules are recursively applied to `x`

```ts
const shape = d.date().coerce();

shape.parse('2020-02-02');
// ⮕ new Date('2020-02-02T00:00:00Z')

shape.parse(1580601600000);
// ⮕ new Date('2020-02-02T00:00:00Z')

shape.parse(null);
// ❌ Error
```

## `enum`

Constrains a value to be equal to one of predefined values:

```ts
d.enum([1, 'foo', 'bar']);
// ⮕ Shape<1 | 'foo' | 'bar'>
```

Or use an enum to limit possible values:

```ts
enum Foo {
  BAR = 'bar',
  QUX = 'qux'
}

d.enum(Foo);
// ⮕ Shape<Foo>
```

Or use
[an object with a `const` assertion](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions):

```ts
const Foo = {
  BAR: 'bar',
  QUX: 'qux'
} as const;

d.enum(Foo);
// ⮕ Shape<'bar' | 'qux'>
```

### Type coercion

If an enum is defined as a key-value mapping the keys can be coerced to values:

```ts
enum Foo {
  BAR = 'bar',
  QUX = 'qux'
}

const shape = d.enum(Foo).coerce();
// ⮕ Shape<Foo>

shape.parse('BAR');
// ⮕ Foo.BAR
```

If enum is defined as an array of values, then coercion isn't possible. Use [a fallback value](#fallback-values)
instead:

```ts
const shape = d.enum(['foo', 'bar']).catch('foo');
// ⮕ Shape<'foo' | 'bar'>

shape.parse('bar');
// ⮕ 'bar'

shape.parse('qux');
// ⮕ 'foo'
```

## `instanceOf`

Constrains a value to be an object that is an instance of a class:

```ts
class Foo {
  bar: string;
}

d.instanceOf(Foo);
// ⮕ Shape<Foo>
```

## `integer`

Constrains a value to be an integer.

```ts
d.integer().min(5);
// ⮕ Shape<number>

d.int().max(5);
// ⮕ Shape<number>
```

This is a shortcut for number shape declaration:

```ts
d.number().integer();
// ⮕ Shape<number>
```

Integers follow [number type coercion rules](#number).

## `intersection`

Creates a shape that checks that the input value conforms to all shapes.

```ts
d.intersection([
  d.object({
    foo: d.string()
  }),
  d.object({
    bar: d.number()
  })
]);
// ⮕ Shape<{ foo: string } & { bar: string }>
```

Or use a shorter alias `and`:

```ts
d.and([
  d.array(d.string()),
  d.array(d.enum(['foo', 'bar']))
]);
// ⮕ Shape<string[] & Array<'foo' | 'bar'>>
```

When working with objects, [extend objects](#extending-objects) instead of intersecting them whenever possible, since
object shapes are more performant than object intersection shapes.

There's a logical difference between extended and intersected objects. Let's consider two shapes that both contain the
same key:

```ts
const shape1 = d.object({
  foo: d.string(),
  bar: d.boolean(),
});

const shape2 = d.object({
  // ⚠️ Notice that the type of foo in shape2 differs from shape1.
  foo: d.number()
});
```

Object extensions overwrite properties of the left object with properties of the right object:

```ts
const shape = shape1.extend(shape2);
// ⮕ Shape<{ foo: number, bar: boolean }>
```

The intersection requires the input value to conform both shapes at the same time, it's no possible since there are no
values that can satisfy the `string | number` type. So the type of property `foo` becomes `never` and no value would be
able to satisfy the resulting intersection shape.

```ts
const shape = d.and([shape1, shape2]);
// ⮕ Shape<{ foo: never, bar: boolean }>
```

## `json`

Parses input strings as JSON:

```ts
d.json();
// ⮕ Shape<string, any>
```

Works best with [shape piping](#shape-piping):

```ts
const shape = d.json().to(
  d.object({
    foo: d.number()
  })
);
// ⮕ Shape<string, { foo: number }>

shape.parse('{"foo":42}');
// ⮕ { foo: 42 }
```

## `lazy`

To showcase how to define a recursive shape, let's create a shape that validates JSON:

```ts
type Json =
  | number
  | string
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

const jsonShape: d.Shape<Json> = d.lazy(() =>
  d.or([
    d.number(),
    d.string(),
    d.boolean(),
    d.null(),
    d.array(jsonShape),
    d.record(jsonShape)
  ])
);
```

Note that the `Json` type is defined explicitly, because it cannot be inferred from the shape which references itself
directly in its own initializer.

> **Warning**
>
> While Doubter supports cyclic types, it doesn't support cyclic data structures.
>
> The latter would cause an infinite loop at runtime.

## `nan`

A shape that requires an input to be equal to `NaN`:

```ts
d.nan();
// ⮕ Shape<number>
```

If you want to constrain a number and allow `NaN` values, use [`number`](#number):

```ts
d.number().nan();
// ⮕ Shape<number>
```

## `never`

A shape that always raises a validation issue regardless of an input value:

```ts
d.never();
// ⮕ Shape<never>
```

## `null`

A shape that requires an input to be `null`:

```ts
d.null();
// ⮕ Shape<null>
```

## `number`

Constrains a finite number.

```ts
d.number();
// ⮕ Shape<number>
```

Allow `NaN` input values:

```ts
d.number().nan();
// ⮕ Shape<number>
```

Replace `NaN` with a default value:

```ts
d.number().nan(0).parse(NaN);
// ⮕ 0
```

Limit the exclusive `gt` and inclusive `gte` minimum and the exclusive `lt` and inclusive `lte` maximum values:

```ts
// The number must be greater than 5 and less then of equal to 10
d.number().gt(0.5).lte(2.5)
// ⮕ Shape<number>
```

Constrain a number to be a multiple of a divisor:

```ts
// Number must be divisible by 5 without a remainder
d.number().multipleOf(5);
```

Constrain the number to be an integer:

```ts
d.number().integer();
// or
d.int();
```

The integer check is always applied before other checks.

### Type coercion

- `null` and `undefined` → `0`
- `false` → `0`
- `true` → `1`
- String `x` → `+x`
- Date `x` → `x.getTime()`
- Array `[x]` → `x`, rules are recursively applied to `x`
- Other values, including `NaN` and `±Infinity` aren't coerced.

```ts
const shape = d.number().coerce();

shape.parse(null);
// ⮕ 0

shape.parse(['42']);
// ⮕ 42

shape.parse('Mars');
// ❌ Error
```

No implicit rounding is performed during coercion:

```ts
d.number().integer().coerce().parse('3.14');
// ❌ Error
```

## `object`

Constrains a value to be an object with a set of properties:

```ts
d.object({
  foo: d.string(),
  bar: d.number()
});
// ⮕ Shape<{ foo: string, bar: number }>
```

### Optional properties

If the inferred type of the property shape is a union with `undefined` then the property becomes optional:

```ts
d.object({
  foo: d.string().optional(),
  bar: d.number()
});
// ⮕ Shape<{ foo?: string | undefined, bar: number }>
```

Or you can define optional properties as a union:

```ts
d.object({
  foo: d.or([d.string(), d.undefined()]),
});
// ⮕ Shape<{ foo?: string | undefined }>
```

If the transformation result extends `undefined` then the output property becomes optional:

```ts
d.object({
  foo: d.string().transform(
    value => value === 'foo' ? value : undefined
  ),
});
// ⮕ Shape<{ foo: string }, { foo?: string | undefined }>
```

### Index signature

Add an index signature to the object type, so all properties that aren't listed explicitly are validated with the rest
shape:

```ts
const shape = d.object({
  foo: d.string(),
  bar: d.number()
});
// ⮕ Shape<{ foo: string, bar: number }>

const restShape = d.or([
  d.string(),
  d.number()
]);
// ⮕ Shape<string | number>

shape.rest(restShape);
// ⮕ Shape<{ foo: string, bar: number, [key: string]: string | number }>
```

Unlike an index signature in TypeScript, a rest shape is applied only to keys that aren't explicitly specified among
object property shapes.

### Unknown keys

Keys that aren't defined explicitly can be handled in several ways:

- constrained by the [rest shape](#index-signature);
- stripped;
- preserved as is, this is the default behavior;
- prohibited.

Force an object to have only known keys. If an unknown key is met, a validation issue is raised.

```ts
d.object({
  foo: d.string(),
  bar: d.number()
}).exact();
```

Strip unknown keys, so the object is cloned if an unknown key is met, and only known keys are preserved.

```ts
d.object({
  foo: d.string(),
  bar: d.number()
}).strip();
```

Derive the new shape and override the strategy for unknown keys:

```ts
const shape = d.object({ foo: d.string() }).exact();

// Unknonwn keys are now preserved
shape.preserve();
```

### Picking and omitting properties

Picking keys from an object creates the new shape that contains only listed keys:

```ts
const shape1 = d.object({
  foo: d.string(),
  bar: d.number()
});

const shape2 = shape1.pick(['foo']);
// ⮕ Shape<{ foo: string }>
```

Omitting keys of an object creates the new shape that contains all keys except listed ones:

```ts
const shape = d.object({
  foo: d.string(),
  bar: d.number()
});

shape.omit(['foo']);
// ⮕ Shape<{ bar: number }>
```

### Extending objects

Add new properties to the object shape:

```ts
const shape = d.object({
  foo: d.string(),
  bar: d.number()
});

shape.extend({
  qux: d.boolean()
});
// ⮕ Shape<{ foo: string, bar: number, qux: boolean }>
```

Merging object shapes preserves the index signature of the left-hand shape:

```ts
const fooShape = d.object({
  foo: d.string()
}).rest(d.or([d.string(), d.number()]));

const barShape = d.object({
  bar: d.number()
});

fooShape.extend(barShape);
// ⮕ Shape<{ foo: string, bar: number, [key: string]: string | number }>
```

### Making objects partial and required

Object properties are optional if their type extends `undefined`. Derive an object shape that would have its properties
all marked as optional:

```ts
const shape = d.object({
  foo: d.string(),
  bar: d.number()
});

shape.partial()
// ⮕ Shape<{ foo?: string | undefined, bar?: number | undefined }>
```

Specify which fields should be marked as optional:

```ts
const shape = d.object({
  foo: d.string(),
  bar: d.number()
});

shape.partial(['foo'])
// ⮕ Shape<{ foo?: string | undefined, bar: number }>
```

In the same way, properties that are optional can be made required:

```ts
const shape = d.object({
  foo: d.string().optional(),
  bar: d.number()
});

shape.required(['foo'])
// ⮕ Shape<{ foo: string, bar: number }>
```

Note that `required` would force the value of both input and output to be non-`undefined`.

## `promise`

A shape that constrains to the resolved value of a `Promise`.

```ts
d.promise(d.string());
// ⮕ Shape<Promise<string>>
```

Transform the value inside a promise:

```ts
const shape = d.promise(d.string().transform(parseFloat));
// ⮕ Shape<Promise<string>, Promise<number>>
```

Promise shapes don't support sync parsing, so `tryAsync`, `parseAsync` or `parseOrDefaultAsync` should be used:

```ts
await shape.parseAsync(Promise.resolve('42'));
// ⮕ 42

await shape.parseAsync('42');
// ❌ Error
```

### Type coercion

If an input value isn't a promise then it is implicitly wrapped in `Promise.resolve`:

```ts
const shape = d.promise(d.string()).coerce();

await shape.parseAsync(Promise.resolve('Mars'));
// ⮕ 'Mars'

await shape.parseAsync('Pluto');
// ⮕ 'Pluto'
```

## `symbol`

Constrains a value to be an arbitrary symbol.

```ts
d.symbol();
// ⮕ Shape<symbol>
```

To constrain an input to an exact symbol, prefer [`const`](#const):

```ts
const foo = Symbol();

d.const(foo);
// ⮕ Shape<typeof foo>
```

Or use an [`enum`](#enum) to allow several exact symbols:

```ts
const foo = Symbol('foo');
const bar = Symbol('bar');

d.enum([foo, bar]);
// ⮕  Shape<typeof foo | typeof bar>
```

## `transform`

Transforms the input value:

```ts
const shape = d.transform(parseFloat);
// ⮕ Shape<any, number>
```

Use `transform` in conjunction with [shape-piping](#shape-piping):

```ts
shape.to(d.number().min(3).max(5));
```

## `record`

Constrain values of a dictionary-like object:

```ts
d.record(d.number())
// ⮕ Shape<Record<string, number>>
```

Constrain both keys and values of a dictionary-like object:

```ts
d.record(d.string(), d.number())
// ⮕ Shape<Record<string, number>>
```

Pass any shape that extends `Shape<string>` as a key constraint:

```ts
const keyShape = d.enum(['foo', 'bar']);
// ⮕ Shape<'foo' | 'bar'>

d.record(keyShape, d.number());
// ⮕ Shape<Record<'foo' | 'bar', number>>
```

Rename record keys using transformation:

```ts
const keyShape = d.enum(['foo', 'bar']).transform(
  value => value.toUpperCase() as 'FOO' | 'BAR'
);
// ⮕ Shape<'foo' | 'bar', 'FOO' | 'BAR'>

const shape = d.record(keyShape, d.number());
// ⮕ Shape<Record<'foo' | 'bar', number>, Record<'FOO' | 'BAR', number>>

shape.parse({ foo: 1, bar: 2 });
// ⮕ { FOO: 1, BAR: 2 }
```

## `string`

Constrains a value to be string.

```ts
d.string();
// ⮕ Shape<string>
```

Constrain the string length limits:

```ts
d.string().min(1).max(10);
```

Limit both minimum and maximum string length at the same time:

```ts
d.string().length(5);
```

Constrain a string with a regular expression:

```ts
d.string().regex(/foo|bar/);
```

### Type coercion

- `null` and `undefined` → `''`
- `false` → `'false'`
- `true` → `'true'`
- Number `x` → `String(x)`
- Array `[x]` → `x`, rules are recursively applied to `x`

```ts
const shape = d.string().coerce();

shape.parse(null);
// ⮕ ''

shape.parse([42]);
// ⮕ '42'

shape.parse({ foo: 'bar' });
// ❌ Error
```

## `tuple`

Constrains a value to be a tuple where elements at particular positions have concrete types:

```ts
d.tuple([d.string(), d.number()]);
// ⮕ Shape<[string, number]>
```

Specify a rest tuple elements:

```ts
d.tuple([d.string(), d.number()], d.boolean());
// ⮕ Shape<[string, number, ...boolean]>
```

### Type coercion

```ts
const shape = d.tuple([d.number()]).coerce();
// ⮕ Shape<[number]>

shape.parse(42);
// ⮕ [42]
```

If a tuple has more than one positioned element then coercion isn't possible.

## `union`

A constraint that allows a value to be one of the given types:

```ts
d.union([d.string(), d.number()]);
// ⮕ Shape<string | number>
```

Use a shorter alias `or`:

```ts
d.or([d.string(), d.number()]);
```

## `undefined`

A shape that requires an input to be `undefined`:

```ts
d.undefined();
// ⮕ Shape<undefined>
```

## `unknown`

An unconstrained value that is inferred as `unknown`:

```ts
d.unknown();
// ⮕ Shape<unknown>
```

## `void`

A shape that requires an input to be `undefined` that is typed as `void`:

```ts
d.void();
// ⮕ Shape<void>
```

# Performance

Clone this repo and use `npm ci && npm run perf -- -t 'overall'` to run the performance testsuite.

![Parsing performance chart](./images/perf.svg)
