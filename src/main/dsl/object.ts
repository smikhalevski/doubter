import { Dict, Message, TypeCheckOptions } from '../shared-types';
import { AnyShape, ObjectShape } from '../shapes';

/**
 * Creates the object shape.
 *
 * @param shapes The mapping from an object key to a corresponding shape.
 * @param options The constraint options or an issue message.
 */
export function object<P extends Dict<AnyShape>>(shapes: P, options?: TypeCheckOptions | Message): ObjectShape<P> {
  return new ObjectShape<P>(shapes, null, options);
}
