class MyComponent extends HTMLElement {
  constructor() {
    super();
    console.log("hello world");
  }
}

customElements.define("my-component", MyComponent);
