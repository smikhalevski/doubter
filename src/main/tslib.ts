export function __extends(constructor: Function, superConstructor: Function): void {
  const Super = class {
    constructor() {
      this.constructor = constructor;
    }
  };

  Super.prototype = superConstructor.prototype;

  Object.setPrototypeOf(constructor, superConstructor);

  constructor.prototype = new Super();
}
