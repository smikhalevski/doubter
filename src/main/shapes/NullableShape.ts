import { AnyShape } from './Shape';
import { DefaultableShape } from './DefaultableShape';

export class NullableShape<
  S extends AnyShape,
  O extends S['output'] | null = S['output'] | null
> extends DefaultableShape<S, S['input'] | null, O> {
  constructor(shape: S, readonly defaultValue?: O) {
    super(shape, null, defaultValue);
  }
}
