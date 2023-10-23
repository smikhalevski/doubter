import { CoercibleShape } from '../../main';

describe('CoercibleShape', () => {
  let shape: CoercibleShape;

  beforeEach(() => {
    shape = new CoercibleShape();
    shape['_coerce'] = jest.fn(shape['_coerce']);
  });

  test('detects coercion mode', () => {
    expect(new CoercibleShape().coercionMode).toBe('defer');
    expect(new CoercibleShape().noCoerce().coercionMode).toBe('no-coerce');
    expect(new CoercibleShape().coerce().coercionMode).toBe('coerce');
  });

  test('does not try coerce by default', () => {
    shape['_tryCoerce'](111, false);

    expect(shape['_coerce']).toHaveBeenCalledTimes(0);
  });

  test('tries to coerce if forced', () => {
    shape['_tryCoerce'](111, true);

    expect(shape['_coerce']).toHaveBeenCalledTimes(1);
  });

  test('tries to coerce if coercion is enabled', () => {
    shape = shape.coerce();
    shape['_tryCoerce'](111, false);

    expect(shape['_coerce']).toHaveBeenCalledTimes(1);
  });
});
