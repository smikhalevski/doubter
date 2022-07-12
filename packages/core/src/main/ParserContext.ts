import { RaiseIssue } from './shared-types';
import { Issue } from './issue-utils';

export class ParserContext {
  issues: Issue[];

  /**
   * `true` if the context contains issues under the current path.
   */
  valid = true;

  aborted = false;

  private _keyStack: any[];
  private _validityStack: boolean[];

  private _cursor = 0;
  private _offset = 0;

  constructor(private _parent?: ParserContext, isolated = false) {
    this.issues = _parent && !isolated ? _parent.issues : [];
    this._keyStack = _parent ? _parent.getPath() : [];
    this._validityStack = _parent ? _parent._validityStack.slice(0) : [];
  }

  raiseIssue: RaiseIssue = (issue): void => {
    // this.issues.push({
    //   path: this.getPath(),
    //   code,
    //   message,
    //   meta,
    // });
    //
    // if (!this.valid) {
    //   return;
    // }
    //
    // this.valid = false;
    //
    // const { _cursor, _validityStack, _parent, _offset } = this;
    //
    // if (_parent !== null) {
    //   const parentValidityStack = _parent._validityStack;
    //   for (let i = 0; i <= _offset; ++i) {
    //     parentValidityStack[i] = false;
    //   }
    // }
    //
    // for (let i = 0; i <= _cursor; ++i) {
    //   _validityStack[i] = true;
    // }
  };

  // /**
  //  * Checks that an object was already visited, and adds it to the visited objects' list if it wasn't.
  //  *
  //  * @param value The value to check.
  //  * @returns `true` if the object was visited before, or `false` otherwise.
  //  */
  // getParsedValue<T extends object>(value: T): T | null {
  //   return null;
  // }
  //
  // setParsedValue() {}

  /**
   * Creates a new branch context.
   *
   * @param isolated If `true` then the returned branch tracks issues in a separate list.
   * @return The new branch context.
   */
  fork(isolated?: boolean): ParserContext {
    return new ParserContext(this, isolated);
  }

  absorb(context: ParserContext): void {}

  // /**
  //  * Adds issues raised for this branch to the parent context, if this branch was isolated.
  //  */
  // exitBranch(): void {
  //   const { issues, _parent, _offset } = this;
  //
  //   if (this.valid || _parent === null || _parent.issues === issues) {
  //     return;
  //   }
  //   for (let i = 0; i <= _offset; ++i) {
  //     _parent._validityStack[i] = false;
  //   }
  //   _parent.issues.push(...issues);
  // }

  /**
   * The current object path.
   */
  getPath(): any[] {
    return this._keyStack.slice(0, this._cursor);
  }

  /**
   * Appends a key to the path.
   */
  enterKey(key: unknown): this {
    this._keyStack[this._cursor++] = key;
    this.valid = this._validityStack[this._cursor] = true;
    return this;
  }

  /**
   * Removes the last key from the path.
   */
  exitKey(): void {
    if (this._cursor > 0) {
      this.valid = this._validityStack[--this._cursor];
    }
  }
}
