// @ts-check

import { CustomElement } from "./custom-element.js";

class MyComponent extends CustomElement {
  constructor() {
    super();
    this.render(this.html`
      <h1 role=${"heading"}>hello ${"world"}</h1>
      <button @click=${() =>
      console.log("hello there")} title="test">Click here</button>
      ${true ? this.html`<p>this is true</p>` : this.html`<p>this is false</p>`}
      <ul>
        ${[4, 5, 6].map((num) => this.html`<li test=${666}>${num}</li>`)}
      </ul>
    `);
  }
}

customElements.define("my-component", MyComponent);
