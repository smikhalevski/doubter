export function __extends(constructor, superConstructor) {
  const Super = function () {
    this.constructor = constructor;
  };

  Super.prototype = superConstructor.prototype;

  Object.setPrototypeOf(constructor, superConstructor);

  constructor.prototype = new Super();
}
