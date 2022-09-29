import { Shape, ValidationError } from '../main';
import { appendConstraint, createApplyConstraints } from '../main/utils';

describe('addConstraint', () => {
  class MockShape extends Shape {
    public override _constraints: any[] = [];
  }

  test('adds a constraint to a shape', () => {
    const constraint = () => undefined;
    const shape = appendConstraint(new MockShape(false), 'foo', undefined, constraint);

    expect(shape._constraints).toEqual(['foo', false, constraint]);
  });

  test('adds an unsafe constraint to a shape', () => {
    const constraint = () => undefined;
    const shape = appendConstraint(new MockShape(false), 'foo', { unsafe: true }, constraint);

    expect(shape._constraints).toEqual(['foo', true, constraint]);
  });
});

describe('createApplyConstraints', () => {
  test('returns null if there are no constraints', () => {
    expect(createApplyConstraints([])).toBe(null);
  });

  test('calls a single constraint', () => {
    const constraint = jest.fn();

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, null)).toBe(null);

    expect(constraint).toHaveBeenCalledTimes(1);
    expect(constraint).toHaveBeenNthCalledWith(1, 'aaa', undefined);
  });

  test('does not call a constraint if there are issues', () => {
    const constraint = jest.fn();

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, [])).toEqual([]);

    expect(constraint).toHaveBeenCalledTimes(0);
  });

  test('calls an unsafe constraint if there are issues', () => {
    const constraint = jest.fn();

    const applyConstraints = createApplyConstraints(['', true, constraint])!;

    expect(applyConstraints('aaa', undefined, [])).toEqual([]);

    expect(constraint).toHaveBeenCalledTimes(1);
    expect(constraint).toHaveBeenNthCalledWith(1, 'aaa', undefined);
  });

  test('captures an error thrown by a constraint', () => {
    const constraint = () => {
      throw new ValidationError([{ code: 'foo' }]);
    };

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, null)).toEqual([{ code: 'foo', path: [] }]);
  });

  test('captures a returned issue', () => {
    const constraint = () => ({});

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, null)).toEqual([{ code: 'unknown', path: [] }]);
  });

  test('captures a returned array of issues', () => {
    const constraint = () => [{ code: 'foo' }, { code: 'bar' }];

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, null)).toEqual([
      { code: 'foo', path: [] },
      { code: 'bar', path: [] },
    ]);
  });

  test('ignores an empty array of issues', () => {
    const constraint = () => [];

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, null)).toBe(null);
  });

  test('ignores non-objects results', () => {
    const constraint = () => {
      return 111 as any;
    };

    const applyConstraints = createApplyConstraints(['', false, constraint])!;

    expect(applyConstraints('aaa', undefined, null)).toBe(null);
  });

  test('captures issues from the first constraint in non-verbose mode', () => {
    const constraint0 = () => ({ code: 'foo' });
    const constraint1 = () => ({ code: 'bar' });

    const applyConstraints = createApplyConstraints(['', true, constraint0, '', true, constraint1])!;

    expect(applyConstraints('aaa', undefined, null)).toEqual([{ code: 'foo', path: [] }]);
  });

  test('captures issues from two unsafe constraints in verbose mode', () => {
    const constraint0 = () => ({ code: 'foo' });
    const constraint1 = () => ({ code: 'bar' });

    const applyConstraints = createApplyConstraints(['', true, constraint0, '', true, constraint1])!;

    expect(applyConstraints('aaa', { verbose: true }, null)).toEqual([
      { code: 'foo', path: [] },
      { code: 'bar', path: [] },
    ]);
  });

  test('captures issues from multiple unsafe constraints in the verbose mode', () => {
    const constraints: any = [];

    for (let i = 0; i < 6; i++) {
      const code = String(i).repeat(3);

      constraints.push(code, i % 2 === 0, () => {
        return { code };
      });
    }

    const applyConstraints = createApplyConstraints(constraints)!;

    expect(applyConstraints('aaa', { verbose: true }, null)).toEqual([
      { code: '000', path: [] },
      { code: '222', path: [] },
      { code: '444', path: [] },
    ]);
  });
});
