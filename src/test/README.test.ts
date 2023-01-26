import qs from 'qs';
import * as d from '../main';

describe('README', () => {
  test('rename keys', () => {
    const keyShape = d.enum(['foo', 'bar']).transform(value => value.toUpperCase() as 'FOO' | 'BAR');

    const shape = d.record(keyShape, d.number());

    expect(shape.parse({ foo: 1, bar: 2 })).toStrictEqual({ FOO: 1, BAR: 2 });
  });

  test('query strings', () => {
    const queryShape = d.object({
      name: d.string().optional(),
      age: d.int().coerce().gt(0).catch().optional(),
    });

    expect(queryShape.parse(qs.parse('name=Frodo&age=50'))).toEqual({ name: 'Frodo', age: 50 });

    expect(queryShape.parse(qs.parse('age=-33'))).toStrictEqual({ age: undefined });
  });
});
