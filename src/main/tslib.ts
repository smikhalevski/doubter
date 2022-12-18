export function __extends(ctor: Function, superCtor: Function): void {
  const Super = function (this: object) {
    this.constructor = ctor;
  };

  Super.prototype = superCtor.prototype;

  ctor.prototype = new (Super as unknown as new () => object)();
}
