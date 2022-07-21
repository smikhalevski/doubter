import { ParserContext } from '../main';

describe('ParserContext', () => {
  test('creates a clean context', () => {
    const context = ParserContext.create();

    expect(context.aborted).toBe(false);
    expect(context.valid).toBe(true);
    expect(context.issues).toEqual([]);
    expect(context.getPath()).toEqual([]);
  });

  test('enters a key', () => {
    const context = ParserContext.create();

    expect(context.enterKey('aaa')).toBe(context);
    context.enterKey('bbb');

    expect(context.getPath()).toEqual(['aaa', 'bbb']);
  });

  test('exits a key', () => {
    const context = ParserContext.create();

    context.enterKey('aaa').enterKey('bbb');
    context.exitKey();

    expect(context.getPath()).toEqual(['aaa']);
  });

  test('raises an issue', () => {
    const context = ParserContext.create();

    context.raiseIssue({ code: 'aaa', path: [], input: 'bbb', param: 'ccc' });

    expect(context.issues).toEqual([
      {
        code: 'aaa',
        path: [],
        input: 'bbb',
        param: 'ccc',
      },
    ]);
    expect(context.aborted).toBe(false);
    expect(context.valid).toBe(false);
  });

  test('aborts the context', () => {
    const context = ParserContext.create(true);

    context.raiseIssue({ code: 'aaa', path: [], input: 'bbb', param: 'ccc' });

    expect(context.aborted).toBe(true);
    expect(context.valid).toBe(false);
  });

  test('forks a context', () => {
    const context = ParserContext.create();

    const context1 = context.fork();

    expect(context1.issues).toBe(context.issues);
    expect(context1.aborted).toBe(false);
    expect(context1.valid).toBe(true);
  });

  test('forked context inherits path', () => {
    const context = ParserContext.create();
    context.enterKey('aaa');

    expect(context.fork().getPath()).toEqual(['aaa']);
  });

  test('forked context does not inherit validity status', () => {
    const context = ParserContext.create();
    context.raiseIssue({ code: 'aaa', path: [], input: 'bbb', param: 'ccc' });

    const context1 = context.fork();

    expect(context1.valid).toBe(true);
  });

  test('forks a local context', () => {
    const context = ParserContext.create();

    const context1 = context.fork(true);

    expect(context1.issues).not.toBe(context.issues);
    expect(context1.aborted).toBe(false);
    expect(context1.valid).toBe(true);
  });

  test('issues raised by the forked context are propagated to the parent', () => {
    const context = ParserContext.create();

    const context1 = context.fork();

    context1.raiseIssue({ code: 'aaa', path: [], input: 'bbb', param: 'ccc' });

    expect(context.aborted).toBe(false);
    expect(context.valid).toBe(false);

    expect(context1.aborted).toBe(false);
    expect(context1.valid).toBe(false);
  });

  test('issues raised by the local forked context are not propagated to the parent', () => {
    const context = ParserContext.create();

    const context1 = context.fork(true);

    context1.raiseIssue({ code: 'aaa', path: [], input: 'bbb', param: 'ccc' });

    expect(context.aborted).toBe(false);
    expect(context.valid).toBe(true);

    expect(context1.aborted).toBe(false);
    expect(context1.valid).toBe(false);
  });

  test('aborts the forked context', () => {
    const context = ParserContext.create(true);

    const context1 = context.fork();

    context1.raiseIssue({ code: 'aaa', path: [], input: 'bbb', param: 'ccc' });

    expect(context.aborted).toBe(true);
    expect(context.valid).toBe(false);

    expect(context1.aborted).toBe(true);
    expect(context1.valid).toBe(false);
  });
});
