export class Signal extends EventTarget {
  #value;

  constructor(value) {
    super();
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    if (this.#value === value) return;
    this.#value = value;
    this.dispatchEvent(new CustomEvent("change"));
  }

  effect(fn) {
    fn();
    this.addEventListener("change", fn);
    return () => this.removeEventListener("change", fn);
  }
}
