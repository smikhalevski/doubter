import { Issue, RaiseIssue } from './shared-types';

export class ParserContext {
  /**
   * `true` if the parsing is aborted, or `false` otherwise.
   */
  aborted = false;

  /**
   * `true` if there's no issues.
   */
  valid = true;

  private _cursor;

  /**
   * Creates a new {@link ParserContext} instance.
   *
   * @param _quick If `true` then value is returned as soon as the first issue is raised. Otherwise, the value is
   * returned after all issues are collected.
   * @param _path The path represented by this context.
   * @param issues The mutable list of issues.
   */
  constructor(private _quick = false, private _path: any[] = [], public issues: Issue[] = []) {
    this._cursor = _path.length;
  }

  raiseIssue: RaiseIssue = (issue): void => {
    this.issues.push(issue);
    this.aborted = this._quick;
    this.valid = false;
  };

  fork(isolated: boolean): ParserContext {
    return new ParserContext(this._quick, this.getPath(), isolated ? [] : this.issues);
  }

  /**
   * Adds issues from the context to this context.
   *
   * @param context The context to absorb issues from.
   */
  absorb(context: ParserContext): void {
    context.issues.forEach(this.raiseIssue);
  }

  /**
   * The current path pointed by the context.
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
