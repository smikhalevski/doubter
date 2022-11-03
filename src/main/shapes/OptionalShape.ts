import { AnyShape } from './Shape';
import { DefaultableShape } from './DefaultableShape';

export class OptionalShape<
  S extends AnyShape,
  O extends S['output'] | undefined = S['output'] | undefined
> extends DefaultableShape<S, S['input'] | undefined, O> {
  constructor(shape: S, readonly defaultValue?: O) {
    super(shape, undefined, defaultValue);
  }
}
