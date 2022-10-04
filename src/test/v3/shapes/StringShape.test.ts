import { BooleanShape2, NumberShape2, ObjectShape2, StringShape2 } from '../../../main/v3/shapes/Shape';
import { CODE_TYPE } from '../../../main/shapes/constants';

describe('StringShape2', () => {
  test('returns ok', () => {
    expect(new StringShape2().try('aaa')).toEqual({ ok: true, value: 'aaa' });
  });

  test('returns err', () => {
    expect(new StringShape2().try(111)).toEqual({ ok: false, issues: [{ code: CODE_TYPE, path: [] }] });
  });

  test('applies checks', () => {
    expect(new StringShape2().min(3).try('aa')).toEqual({ ok: false, issues: [{ code: CODE_TYPE, path: [] }] });
  });
});

describe('ObjectShape2', () => {
  test('returns ok', () => {
    const shape = new ObjectShape2({ foo: new StringShape2() });
    shape.try({ foo: 'aaa' });
    expect(shape.try({ foo: 'aaa' })).toEqual({ ok: true, value: { foo: 'aaa' } });
  });

  test('returns err', () => {
    const shape = new ObjectShape2({ foo: new StringShape2() });

    expect(shape.try({ foo: 111 })).toEqual({ ok: true, value: { foo: 'aaa' } });
  });

  test('returns ok in perf test', () => {
    const value = {
      a1: 1,
      a2: -1,
      a3: Number.MAX_VALUE,
      a4: 'foo',
      a5: 'bar',
      a6: true,
      a7: {
        a71: 'baz',
        a72: 1,
        a73: false,
      },
    };

    const shape = new ObjectShape2({
      a1: new NumberShape2(),
      a2: new NumberShape2(),
      a3: new NumberShape2(),
      a4: new StringShape2(),
      a5: new StringShape2(),
      a6: new BooleanShape2(),
      a7: new ObjectShape2({
        a71: new StringShape2(),
        a72: new NumberShape2(),
        a73: new BooleanShape2(),
      }),
    });

    expect(shape.try(value)).toEqual({ ok: true, value });
  });

  test('qqq', () => {
    const shape = new ObjectShape2({ foo: new StringShape2() }).index(new StringShape2());

    shape.parse({
      foo: 'aaa',
      bar: 'bbb',
    });
  });
});
