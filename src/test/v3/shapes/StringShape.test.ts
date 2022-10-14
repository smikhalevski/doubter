import { BooleanShape, NumberShape, ObjectShape, StringShape } from '../../../main/v3/shapes/Shape';
import { CODE_TYPE } from '../../../main/shapes/constants';

describe('StringShape', () => {
  test('returns ok', () => {
    expect(new StringShape().try('aaa')).toEqual({ ok: true, value: 'aaa' });
  });

  test('returns err', () => {
    expect(new StringShape().try(111)).toEqual({ ok: false, issues: [{ code: CODE_TYPE, path: [] }] });
  });

  // test('applies checks', () => {
  //   expect(new StringShape().min(3).try('aa')).toEqual({ ok: false, issues: [{ code: CODE_TYPE, path: [] }] });
  // });
});

describe('ObjectShape', () => {
  test('returns ok', () => {
    const shape = new ObjectShape({ foo: new StringShape() });
    shape.try({ foo: 'aaa' });
    expect(shape.try({ foo: 'aaa' })).toEqual({ ok: true, value: { foo: 'aaa' } });
  });

  test('returns err', () => {
    const shape = new ObjectShape({ foo: new StringShape() });

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

    const shape = new ObjectShape({
      a1: new NumberShape(),
      a2: new NumberShape(),
      a3: new NumberShape(),
      a4: new StringShape(),
      a5: new StringShape(),
      a6: new BooleanShape(),
      a7: new ObjectShape({
        a71: new StringShape(),
        a72: new NumberShape(),
        a73: new BooleanShape(),
      }),
    });

    expect(shape.try(value)).toEqual({ ok: true, value });
  });

  test('qqq', () => {
    const shape = new ObjectShape({ foo: new StringShape(), bar: new StringShape() }).rest(new StringShape());

    shape.parse({
      foo: 'aaa',
      bar: 'bbb',
    });
  });
});
