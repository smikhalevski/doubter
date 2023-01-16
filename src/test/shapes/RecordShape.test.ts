import { RecordShape, Shape } from '../../main';
import { CODE_TYPE, MESSAGE_OBJECT_TYPE, TYPE_OBJECT } from '../../main/constants';

describe('RecordShape', () => {
  test('raises non object values', () => {
    const valueShape = new Shape();

    const objShape = new RecordShape(null, valueShape);

    expect(objShape.try('')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_OBJECT_TYPE, param: TYPE_OBJECT, path: [] }],
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

    const result: any = objShape.try(obj);

    expect(result).toEqual({ ok: true, value: { KEY1: 'aaa', KEY2: 'bbb' } });
    expect(result.value).not.toBe(obj);
  });

  test('transforms values', () => {
    const keyShape = new Shape();
    const valueShape = new Shape().transform(value => value.toUpperCase());

    const objShape = new RecordShape(keyShape, valueShape);

    const obj = { key1: 'aaa', key2: 'bbb' };

    const result: any = objShape.try(obj);

    expect(result).toEqual({ ok: true, value: { key1: 'AAA', key2: 'BBB' } });
    expect(result.value).not.toBe(obj);
  });

  test('applies checks', () => {
    const objShape = new RecordShape(null, new Shape()).check(() => [{ code: 'xxx' }]);

    expect(objShape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: [] }],
    });
  });

  test('returns value shape for string and number keys', () => {
    const valueShape = new Shape();
    const objShape = new RecordShape(null, valueShape);

    expect(objShape.at('aaa')).toBe(valueShape);
    expect(objShape.at(111)).toBe(valueShape);
    expect(objShape.at(111.222)).toBe(valueShape);
    expect(objShape.at(null)).toBe(null);
    expect(objShape.at(Symbol())).toBe(null);
  });

  describe('async', () => {
    test('raises non object values', async () => {
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new RecordShape(null, valueShape);

      await expect(objShape.tryAsync('')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_OBJECT_TYPE, param: TYPE_OBJECT, path: [] }],
      });
    });

    test('checks values', async () => {
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'xxx' }]);

      const objShape = new RecordShape(null, valueShape);

      await expect(objShape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('checks keys and values', async () => {
      const keyShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'xxx' }]);
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'yyy' }]);

      const objShape = new RecordShape(keyShape, valueShape);

      await expect(objShape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: ['key1'] }],
      });
    });

    test('raises multiple issues in verbose mode', async () => {
      const keyShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'xxx' }]);
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value)).check(() => [{ code: 'yyy' }]);

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

      const result: any = await objShape.tryAsync(obj);

      expect(result).toEqual({ ok: true, value: { KEY1: 'aaa', KEY2: 'bbb' } });
      expect(result.value).not.toBe(obj);
    });

    test('transforms values', async () => {
      const keyShape = new Shape();
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value.toUpperCase()));

      const objShape = new RecordShape(keyShape, valueShape);

      const obj = { key1: 'aaa', key2: 'bbb' };

      const result: any = await objShape.tryAsync(obj);

      expect(result).toEqual({ ok: true, value: { key1: 'AAA', key2: 'BBB' } });
      expect(result.value).not.toBe(obj);
    });

    test('applies checks', async () => {
      const valueShape = new Shape().transformAsync(value => Promise.resolve(value));

      const objShape = new RecordShape(null, valueShape).check(() => [{ code: 'xxx' }]);

      await expect(objShape.tryAsync({})).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx', path: [] }],
      });
    });
  });
});
