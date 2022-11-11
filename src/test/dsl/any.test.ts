import * as d from '../../main';

describe('any', () => {
  test('returns a shape', () => {
    const shape1: d.Shape = d.any();
    const shape2: d.AnyShape = d.any();

    expect(shape1).toBeInstanceOf(d.Shape);
  });

  test('returns a shape with a refinement', () => {
    const cb = () => true;

    const shape1: d.Shape = d.any(cb);
    const shape2: d.Shape<unknown, number> = d.any((value): value is number => true);
    const shape3: d.Shape<string, 'foo'> = d.any((value): value is 'foo' => true);

    expect(shape1.checks[0].param).toBe(cb);
  });
});
