// @ts-check

import { CustomElement } from "./custom-element.js";
import { Signal } from "./signal.js";

class MyComponent extends CustomElement {
  constructor() {
    super();

    const test = new Signal(1);
    const role = new Signal("heading");
    const title = new Signal("hello world");
    const content = true
      ? this.html`<p>this is true</p>`
      : this.html`<p>this is false</p>`;
    const liTest = new Signal(666);
    const items = [new Signal(4), new Signal(5), new Signal(6)].map((num) =>
      this.html`<li test=${liTest}>${num}</li>`
    );
    const onClick = new Signal(() => test.value++);

    this.render(this.html`
      <h1 test=${title} role=${role}>${test}</h1>
      <button @click=${onClick} title="test">Click here</button>
      ${content}
      <ul>
        ${items}
      </ul>
    `);
  }

  static observedAttributes = ["test"];

  attributeChangedCallback(name, prev, next) {
    if (prev === next) return;
  }
}

customElements.define("my-component", MyComponent);
