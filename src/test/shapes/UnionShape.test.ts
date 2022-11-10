import { BooleanShape, NumberShape, Shape, StringShape, UnionShape } from '../../main';
import { CODE_UNION, MESSAGE_UNION } from '../../main/constants';

describe('UnionShape', () => {
  test('distributes buckets', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();

    const applySpy1 = jest.spyOn(shape1, 'apply');
    const applySpy2 = jest.spyOn(shape2, 'apply');
    const applySpy3 = jest.spyOn(shape3, 'apply');

    const unionShape = new UnionShape([shape1, shape2, shape3]);

    expect(unionShape.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
  });

  test('unwraps union shapes into buckets', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();
    const unionShape1 = new UnionShape([shape2, shape3]);

    const applySpy1 = jest.spyOn(shape1, 'apply');
    const applySpy2 = jest.spyOn(shape2, 'apply');
    const applySpy3 = jest.spyOn(shape3, 'apply');
    const unionApplySpy = jest.spyOn(shape3, 'apply');

    const unionShape2 = new UnionShape([shape1, unionShape1]);

    expect(unionShape2.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
    expect(unionApplySpy).not.toHaveBeenCalled();
  });

  test('does not unwrap union shapes that have checks', () => {
    const shape1 = new NumberShape();
    const shape2 = new StringShape();
    const shape3 = new BooleanShape();
    const unionShape1 = new UnionShape([shape2, shape3]).refine(() => true);

    const applySpy1 = jest.spyOn(shape1, 'apply');
    const applySpy2 = jest.spyOn(shape2, 'apply');
    const applySpy3 = jest.spyOn(shape3, 'apply');
    const unionApplySpy = jest.spyOn(unionShape1, 'apply');

    const unionShape2 = new UnionShape([shape1, unionShape1]);

    expect(unionShape2.parse('aaa')).toBe('aaa');
    expect(applySpy1).not.toHaveBeenCalled();
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
    expect(unionApplySpy).toHaveBeenCalledTimes(1);
  });

  test('returns the result of the first shape that returned ok', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape();
    const shape3 = new Shape();

    const applySpy1 = jest.spyOn(shape1, 'apply');
    const applySpy2 = jest.spyOn(shape2, 'apply');
    const applySpy3 = jest.spyOn(shape3, 'apply');

    const unionShape = new UnionShape([shape1, shape2, shape3]);

    expect(unionShape.parse('aaa')).toBe('aaa');
    expect(applySpy1).toHaveBeenCalledTimes(1);
    expect(applySpy2).toHaveBeenCalledTimes(1);
    expect(applySpy3).not.toHaveBeenCalled();
  });

  test('raises if no shapes returned ok', () => {
    const shape1 = new Shape().check(() => [{ code: 'xxx' }]);
    const shape2 = new Shape().check(() => [{ code: 'yyy' }]);

    const unionShape = new UnionShape([shape1, shape2]);

    expect(unionShape.try('aaa')).toEqual({
      ok: false,
      issues: [
        {
          code: CODE_UNION,
          path: [],
          input: 'aaa',
          message: MESSAGE_UNION,
          param: {
            inputTypes: ['any'],
            issues: [
              { code: 'xxx', path: [] },
              { code: 'yyy', path: [] },
            ],
          },
        },
      ],
    });
  });

  test('applies checks', () => {
    const shape1 = new Shape();
    const shape2 = new Shape();

    const unionShape = new UnionShape([shape1, shape2]).check(() => [{ code: 'xxx' }]);

    expect(unionShape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  // test('raises issues from all failures', () => {
  //   expect(new UnionShape([numberShape, stringShape]).validate(true)).toEqual([
  //     {
  //       code: CODE_UNION,
  //       path: [],
  //       input: true,
  //       param: [
  //         {
  //           code: CODE_TYPE,
  //           path: [],
  //           input: true,
  //           param: TYPE_NUMBER,
  //           message: expect.any(String),
  //           meta: undefined,
  //         },
  //         {
  //           code: CODE_TYPE,
  //           input: true,
  //           message: expect.any(String),
  //           param: TYPE_STRING,
  //           path: [],
  //         },
  //       ],
  //       message: 'Must conform a union',
  //       meta: undefined,
  //     },
  //   ]);
  // });
  //
  // test('raises issues from the first failure in the async mode', async () => {
  //   const childShape1 = numberShape.transformAsync(value => Promise.resolve(value + ''));
  //   const childShape = stringShape.transformAsync(value => Promise.resolve(value + ''));
  //
  //   expect(await new UnionShape([childShape1, childShape]).validateAsync(true, { verbose: true })).toEqual([
  //     {
  //       code: CODE_UNION,
  //       path: [],
  //       input: true,
  //       param: [
  //         {
  //           code: CODE_TYPE,
  //           path: [],
  //           input: true,
  //           param: TYPE_NUMBER,
  //           message: expect.any(String),
  //           meta: undefined,
  //         },
  //       ],
  //       message: expect.any(String),
  //       meta: undefined,
  //     },
  //   ]);
  // });
  //
  // test('returns child type at key', () => {
  //   const shape = new UnionShape([new ArrayShape(numberShape), new ArrayShape(stringShape)]);
  //
  //   expect(shape.at(0)).toStrictEqual(new UnionShape([numberShape, stringShape]));
  //   expect(shape.at('aaa')).toBe(null);
  // });
  //
  // test('returns child type at key excluding nulls', () => {
  //   const shape = new UnionShape([new ArrayShape(numberShape), stringShape]);
  //
  //   expect(shape.at(0)).toStrictEqual(numberShape);
  //   expect(shape.at(1)).toStrictEqual(numberShape);
  // });
});
