import { Issue } from './shared-types';

export class ParserContext {
  /**
   * `true` if the parsing should be aborted, or `false` otherwise.
   */
  aborted = false;

  /**
   * `true` if there are no issues, or `false` otherwise.
   */
  valid = true;

  private _cursor;

  static create(quick = false): ParserContext {
    return new ParserContext([], null, quick, []);
  }

  protected constructor(
    public issues: Issue[],
    private _parent: ParserContext | null,
    private _quick: boolean,
    private _path: any[]
  ) {
    this._cursor = _path.length;
  }

  /**
   * Creates a new context that originates from the current path.
   *
   * @param local If `true` then the forked context would raise issues in this context.
   */
  fork(local = false): ParserContext {
    return new ParserContext(local ? [] : this.issues, local ? null : this, this._quick, this.getPath());
  }

  raiseIssue<T extends Issue>(issue: T): void {
    const { _parent } = this;

    this.valid = false;

    if (_parent === null) {
      this.issues.push(issue);
      this.aborted = this._quick;
    } else {
      _parent.raiseIssue(issue);
      this.aborted = _parent.aborted;
    }
  }

  /**
   * The current path that the context points to.
   */
  getPath(): any[] {
    return this._path.slice(0, this._cursor);
  }

  /**
   * Appends a key to the path, so consequent {@link getPath} calls return the longer path.
   */
  enterKey(key: unknown): this {
    this._path[this._cursor++] = key;
    return this;
  }

  /**
   * Removes the last key from the path.
   */
  exitKey(): void {
    --this._cursor;
  }
}
