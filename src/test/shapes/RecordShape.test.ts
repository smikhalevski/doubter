import { ObjectShape, Ok, RecordShape, Shape, StringShape } from '../../main';
import { CODE_TYPE, MESSAGE_TYPE_OBJECT, MESSAGE_TYPE_STRING } from '../../main/constants';
import { TYPE_OBJECT, TYPE_STRING } from '../../main/Type';
import { AsyncMockShape } from './mocks';

describe('RecordShape', () => {
  test('raises an issue for a non-object input value', () => {
    const valueShape = new Shape();

    const shape = new RecordShape(null, valueShape);

    expect(shape.try('')).toEqual({
      ok: false,
      issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_TYPE_OBJECT, param: TYPE_OBJECT }],
    });
  });

  test('checks values', () => {
    const valueShape = new Shape().check(() => [{ code: 'xxx' }]);

    const shape = new RecordShape(null, valueShape);

    expect(shape.try({ key1: 'aaa', key2: 'bbb' })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: ['key1'] },
        { code: 'xxx', path: ['key2'] },
      ],
    });
  });

  test('checks keys and values', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const shape = new RecordShape(keyShape, valueShape);

    expect(shape.try({ key1: 'aaa', key2: 'bbb' })).toEqual({
      ok: false,
      issues: [
        { code: 'xxx', path: ['key1'] },
        { code: 'yyy', path: ['key1'] },
        { code: 'xxx', path: ['key2'] },
        { code: 'yyy', path: ['key2'] },
      ],
    });
  });

  test('raises a single issue issues in an early-return mode', () => {
    const keyShape = new Shape().check(() => [{ code: 'xxx' }]);
    const valueShape = new Shape().check(() => [{ code: 'yyy' }]);

    const shape = new RecordShape(keyShape, valueShape);

    expect(shape.try({ key1: 'aaa', key2: 'bbb' }, { earlyReturn: true })).toEqual({
      ok: false,
      issues: [{ code: 'xxx', path: ['key1'] }],
    });
  });

  test('converts keys', () => {
    const keyShape = new Shape().convert(value => value.toUpperCase());
    const valueShape = new Shape();

    const shape = new RecordShape(keyShape, valueShape);

    const input = { key1: 'aaa', key2: 'bbb' };

    const result = shape.try(input) as Ok;

    expect(result).toEqual({ ok: true, value: { KEY1: 'aaa', KEY2: 'bbb' } });
    expect(result.value).not.toBe(input);
  });

  test('converts values', () => {
    const keyShape = new Shape();
    const valueShape = new Shape().convert(value => value.toUpperCase());

    const shape = new RecordShape(keyShape, valueShape);

    const input = { key1: 'aaa', key2: 'bbb' };

    const result = shape.try(input) as Ok;

    expect(result).toEqual({ ok: true, value: { key1: 'AAA', key2: 'BBB' } });
    expect(result.value).not.toBe(input);
  });

  test('applies operations', () => {
    const shape = new RecordShape(null, new Shape()).check(() => [{ code: 'xxx' }]);

    expect(shape.try({})).toEqual({
      ok: false,
      issues: [{ code: 'xxx' }],
    });
  });

  describe('at', () => {
    test('returns value shape for string and number keys', () => {
      const valueShape = new Shape();
      const shape = new RecordShape(null, valueShape);

      expect(shape.at('aaa')).toBe(valueShape);
      expect(shape.at(111)).toBe(valueShape);
      expect(shape.at(111.222)).toBe(valueShape);
      expect(shape.at(null)).toBeNull();
      expect(shape.at(Symbol())).toBeNull();
    });
  });

  describe('deepPartial', () => {
    test('marks values as optional', () => {
      const shape = new RecordShape(new StringShape(), new StringShape()).deepPartial();

      expect(shape.parse({ key1: undefined })).toEqual({ key1: undefined });
      expect(shape.parse({ key1: 'aaa' })).toEqual({ key1: 'aaa' });

      expect(shape.try({ key1: 111 })).toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: 111, message: MESSAGE_TYPE_STRING, param: TYPE_STRING, path: ['key1'] }],
      });
    });

    test('parses deep partial values', () => {
      const shape = new RecordShape(
        new StringShape(),
        new ObjectShape({ key1: new StringShape() }, null)
      ).deepPartial();

      expect(shape.parse({ aaa: undefined })).toEqual({ aaa: undefined });
      expect(shape.parse({ aaa: { key1: undefined } })).toEqual({ aaa: { key1: undefined } });
      expect(shape.parse({ aaa: { key1: 'aaa' } })).toEqual({ aaa: { key1: 'aaa' } });

      expect(shape.try({ aaa: { key1: 111 } })).toEqual({
        ok: false,
        issues: [
          { code: CODE_TYPE, input: 111, message: MESSAGE_TYPE_STRING, param: TYPE_STRING, path: ['aaa', 'key1'] },
        ],
      });
    });
  });

  describe('async', () => {
    test('raises an issue for a non-object input value', async () => {
      const shape = new RecordShape(null, new AsyncMockShape());

      await expect(shape.tryAsync('')).resolves.toEqual({
        ok: false,
        issues: [{ code: CODE_TYPE, input: '', message: MESSAGE_TYPE_OBJECT, param: TYPE_OBJECT }],
      });
    });

    test('checks values', async () => {
      const valueShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);

      const shape = new RecordShape(null, valueShape);

      await expect(shape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'xxx', path: ['key2'] },
        ],
      });
    });

    test('checks keys and values', async () => {
      const keyShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const valueShape = new AsyncMockShape().check(() => [{ code: 'yyy' }]);

      const shape = new RecordShape(keyShape, valueShape);

      await expect(shape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'yyy', path: ['key1'] },
          { code: 'xxx', path: ['key2'] },
          { code: 'yyy', path: ['key2'] },
        ],
      });
    });

    test('does not invoke the value shape if the previous key shape has raised an issue in an early-return mode', async () => {
      const keyShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const valueShape = new AsyncMockShape();

      await new RecordShape(keyShape, valueShape).tryAsync({ key1: 'aaa', key2: 'bbb' }, { earlyReturn: true });

      expect(keyShape._applyAsync).toHaveBeenCalledTimes(1);
      expect(valueShape._applyAsync).not.toHaveBeenCalled();
    });

    test('does not invoke the key shape if the previous value shape has raised an issue in an early-return mode', async () => {
      const keyShape = new AsyncMockShape();
      const valueShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);

      await new RecordShape(keyShape, valueShape).tryAsync({ key1: 'aaa', key2: 'bbb' }, { earlyReturn: true });

      expect(keyShape._applyAsync).toHaveBeenCalledTimes(1);
      expect(valueShape._applyAsync).toHaveBeenCalledTimes(1);
    });

    test('raises multiple issues', async () => {
      const keyShape = new AsyncMockShape().check(() => [{ code: 'xxx' }]);
      const valueShape = new AsyncMockShape().check(() => [{ code: 'yyy' }]);

      const shape = new RecordShape(keyShape, valueShape);

      await expect(shape.tryAsync({ key1: 'aaa', key2: 'bbb' })).resolves.toEqual({
        ok: false,
        issues: [
          { code: 'xxx', path: ['key1'] },
          { code: 'yyy', path: ['key1'] },
          { code: 'xxx', path: ['key2'] },
          { code: 'yyy', path: ['key2'] },
        ],
      });
    });

    test('converts keys', async () => {
      const keyShape = new Shape().convertAsync(value => Promise.resolve(value.toUpperCase()));
      const valueShape = new Shape();

      const shape = new RecordShape(keyShape, valueShape);

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: { KEY1: 'aaa', KEY2: 'bbb' } });
      expect(result.value).not.toBe(input);
    });

    test('converts values', async () => {
      const keyShape = new Shape();
      const valueShape = new Shape().convertAsync(value => Promise.resolve(value.toUpperCase()));

      const shape = new RecordShape(keyShape, valueShape);

      const input = { key1: 'aaa', key2: 'bbb' };

      const result = (await shape.tryAsync(input)) as Ok;

      expect(result).toEqual({ ok: true, value: { key1: 'AAA', key2: 'BBB' } });
      expect(result.value).not.toBe(input);
    });

    test('applies operations', async () => {
      const shape = new RecordShape(null, new AsyncMockShape()).check(() => [{ code: 'xxx' }]);

      await expect(shape.tryAsync({})).resolves.toEqual({
        ok: false,
        issues: [{ code: 'xxx' }],
      });
    });

    test('does not swallow errors thrown by value shape', async () => {
      const shape = new RecordShape(
        new AsyncMockShape(),
        new AsyncMockShape().check(() => {
          throw new Error('expected');
        })
      );

      await expect(shape.tryAsync({ aaa: 111 })).rejects.toEqual(new Error('expected'));
    });

    test('does not swallow errors thrown by key shape', async () => {
      const keyCheck = jest
        .fn()
        .mockImplementationOnce(value => value)
        .mockImplementationOnce(() => {
          throw new Error('expected');
        });

      const shape = new RecordShape(new AsyncMockShape().check(keyCheck), new AsyncMockShape());

      await expect(shape.tryAsync({ aaa: 111, bbb: 222 })).rejects.toEqual(new Error('expected'));
    });
  });
});
