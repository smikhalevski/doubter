import { ApplyOptions, ObjectShape, Ok, RecordShape, Result, Shape, StringShape } from '../../main';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, MESSAGE_STRING_TYPE, TYPE_OBJECT, TYPE_STRING } from '../../main/constants';

describe('RecordShape', () => {
  class AsyncShape extends Shape {
    protected _isAsync(): boolean {
      return true;
    }

    protected _applyAsync(input: unknown, options: ApplyOptions) {
      return new Promise<Result>(resolve => resolve(Shape.prototype['_apply'].call(this, input, options)));
    }
  }

  let asyncShape: AsyncShape;

  beforeEach(() => {
    asyncShape = new AsyncShape();
  });

  test('raises an issue for a non-object input value', () => {
    const valueShape = new Shape();

    const objShape = new RecordShape(null, valueShape);

    expect(objShape.try('')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_OBJECT_TYPE, param: TYPE_OBJECT }],
    });
  });

  test('checks values', () => {
    const valueShape = new Shape().check(() => [{ code: 'xxx' }]);

    const objShape = new RecordShape(null, valueShape);

    expect(objShape.try({ key1: 'aaa', key2: 'bbb' })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: ['key1'] }],
    });
  });

  test('checks keys and values', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const objShape = new RecordShape(keyShape, valueShape);

    expect(objShape.try({ key1: 'aaa', key2: 'bbb' })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: ['key1'] }],
    });
  });

  test('raises multiple issues in verbose mode', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const objShape = new RecordShape(keyShape, valueShape);

    expect(objShape.try({ key1: 'aaa', key2: 'bbb' }, { verbose: true })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: ['key1'] },
        { code: 'yyy', path: ['key1'] },
        { code: 'xxx', path: ['key2'] },
        { code: 'yyy', path: ['key2'] },
      ],
    });
  });

  test('transforms keys', () => {
    const keyShape = new Shape().transform(value => value.toUpperCase());
    const valueShape = new Shape();

    const objShape = new RecordShape(keyShape, valueShape);

    const obj = { key1: 'aaa', key2: 'bbb' };

    const result = objShape.try(obj) as Ok<unknown>;

    expect(result).toEqual({ ok: true, value: { KEY1: 'aaa', KEY2: 'bbb' } });
    expect(result.value).not.toBe(obj);
  });

  test('transforms values', () => {
    const keyShape = new Shape();
    const valueShape = new Shape().transform(value => value.toUpperCase());

    const objShape = new RecordShape(keyShape, valueShape);

    const obj = { key1: 'aaa', key2: 'bbb' };

    const result = objShape.try(obj) as Ok<unknown>;

    expect(result).toEqual({ ok: true, value: { key1: 'AAA', key2: 'BBB' } });
    expect(result.value).not.toBe(obj);
  });

  test('applies checks', () => {
    const objShape = new RecordShape(null, new Shape()).check(() => [{ code: 'xxx' }]);

    expect(objShape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('at', () => {
    test('returns value shape for string and number keys', () => {
      const valueShape = new Shape();
      const objShape = new RecordShape(null, valueShape);

      expect(objShape.at('aaa')).toBe(valueShape);
      expect(objShape.at(111)).toBe(valueShape);
      expect(objShape.at(111.222)).toBe(valueShape);
      expect(objShape.at(null)).toBeNull();
      expect(objShape.at(Symbol())).toBeNull();
    });
  });

  describe('deepPartial', () => {
    test('marks values as optional', () => {
      const objShape = new RecordShape(new StringShape(), new StringShape()).deepPartial();

      expect(objShape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(objShape.parse({ key1: 'aaa' })).toEqual({ key1: 'aaa' });

      expect(objShape.try({ key1: 111 })).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: ['key1'] }],
      });
    });

    test('parses deep partial values', () => {
      const objShape = new RecordShape(
        new StringShape(),
        new ObjectShape({ key1: new StringShape() }, null)
      ).deepPartial();

      expect(objShape.parse({ aaa: undefined })).toEqual({ aaa: undefined });
      expect(objShape.parse({ aaa: { key1: undefined } })).toEqual({ aaa: { key1: undefined } });
      expect(objShape.parse({ aaa: { key1: 'aaa' } })).toEqual({ aaa: { key1: 'aaa' } });

      expect(objShape.try({ aaa: { key1: 111 } })).toEqual({
        ok: false,
        issues: [
          { code: CODE_TYPE, input: 111, message: MESSAGE_STRING_TYPE, param: TYPE_STRING, path: ['aaa', 'key1'] },
        ],
      });
    });
  });

  describe('async', () => {
    test('raises an issue for a non-object input value', async () => {
      const objShape = new RecordShape(null, asyncShape);

      await expect(objShape.tryAsync('')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_OBJECT_TYPE, param: TYPE_OBJECT }],
      });
    });

    test('checks values', async () => {
      const valueShape = asyncShape.check(() => [{ code: 'xxx' }]);

      const objShape = new RecordShape(null, valueShape);

      await expect(objShape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('checks keys and values', async () => {
      const keyShape = asyncShape.check(() => [{ code: 'xxx' }]);
      const valueShape = asyncShape.check(() => [{ code: 'yyy' }]);

      const objShape = new RecordShape(keyShape, valueShape);

      await expect(objShape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('does not invoke the value shape if the previous key shape has raised an issue', async () => {
      const keyShape = asyncShape.check(() => [{ code: 'xxx' }]);
      const valueShape = asyncShape;

      const applyAsyncKeySpy = jest.spyOn<Shape, any>(keyShape, '_applyAsync');
      const applyAsyncValueSpy = jest.spyOn<Shape, any>(valueShape, '_applyAsync');

      await new RecordShape(keyShape, valueShape).tryAsync({ key1: 'aaa', key2: 'bbb' });

      expect(applyAsyncKeySpy).toHaveBeenCalledTimes(1);
      expect(applyAsyncValueSpy).toHaveBeenCalledTimes(0);
    });

    test('does not invoke the key shape if the previous value shape has raised an issue', async () => {
      const keyShape = asyncShape;
      const valueShape = asyncShape.check(() => [{ code: 'xxx' }]);

      const applyAsyncKeySpy = jest.spyOn<Shape, any>(keyShape, '_applyAsync');
      const applyAsyncValueSpy = jest.spyOn<Shape, any>(valueShape, '_applyAsync');

      await new RecordShape(keyShape, valueShape).tryAsync({ key1: 'aaa', key2: 'bbb' });

      expect(applyAsyncKeySpy).toHaveBeenCalledTimes(1);
      expect(applyAsyncValueSpy).toHaveBeenCalledTimes(1);
    });

    test('raises multiple issues in verbose mode', async () => {
      const keyShape = asyncShape.check(() => [{ code: 'xxx' }]);
      const valueShape = asyncShape.check(() => [{ code: 'yyy' }]);

      const objShape = new RecordShape(keyShape, valueShape);

      await expect(objShape.tryAsync({ key1: 'aaa', key2: 'bbb' }, { verbose: true })).resolves.toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'yyy', path: ['key1'] },
          { code: 'xxx', path: ['key2'] },
          { code: 'yyy', path: ['key2'] },
        ],
      });
    });

    test('transforms keys', async () => {
      const keyShape = new Shape().transformAsync(value => Promise.resolve(value.toUpperCase()));
      const valueShape = new Shape();

      const objShape = new RecordShape(keyShape, valueShape);

      const obj = { key1: 'aaa', key2: 'bbb' };

      const result = (await objShape.tryAsync(obj)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: { KEY1: 'aaa', KEY2: 'bbb' } });
      expect(result.value).not.toBe(obj);
    });

    test('transforms values', async () => {
      const keyShape = new Shape();
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value.toUpperCase()));

      const objShape = new RecordShape(keyShape, valueShape);

      const obj = { key1: 'aaa', key2: 'bbb' };

      const result = (await objShape.tryAsync(obj)) as Ok<unknown>;

      expect(result).toEqual({ ok: true, value: { key1: 'AAA', key2: 'BBB' } });
      expect(result.value).not.toBe(obj);
    });

    test('applies checks', async () => {
      const objShape = new RecordShape(null, asyncShape).check(() => [{ code: 'xxx' }]);

      await expect(objShape.tryAsync({})).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });
  });
});
