import { Shape } from 'doubter';

export class ValidatorShape<O extends object> extends Shape<string> {
  constructor(protected _options: O) {
    super(['string'], false);
  }

  protected _clone(options?: O): this {
    const shape = super._clone();
    shape._options = Object.assign({}, shape._options, options);
    return shape;
  }
}
