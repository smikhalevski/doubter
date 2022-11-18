import * as d from '../../main';

describe('intersection', () => {
  test('infers type', () => {
    const value: { foo: string; bar: number } = d
      .intersection([d.object({ foo: d.string() }), d.object({ bar: d.number() })])
      .parse({ foo: 'aaa', bar: 111 });
  });
});
