export function __extends(constructor: Function, superConstructor: Function): void {
  const Super = function (this: object) {
    this.constructor = constructor;
  };

  Super.prototype = superConstructor.prototype;

  constructor.prototype = new (Super as unknown as new () => object)();
}
