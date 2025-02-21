// @ts-check

import { Computed, html, Signal } from "./html.js";

class MyComponent extends HTMLElement {
  #test;
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    this.#test = new Signal(1);
    const toogle = new Signal(true);
    const content = new Computed(
      () =>
        toogle.value ? html`<p>this is true</p>` : html`<p>this is false</p>`,
      [toogle],
    );
    const liTest = new Signal(666);
    const test2 = new Signal(4);
    const items = [test2, 1, 4].map((num) =>
      html`<li test=${liTest}>${num}</li>`
    );
    const onClick = new Signal(() => toogle.value = !toogle.value);
    const title = new Computed(() => `hello ${this.#test.value}`, [this.#test]);

    shadow.append(...html`
      <h1 test="${this.#test}" role="heading">${title}</h1>
      <button onclick="${onClick}" title="test">Click here</button>
      <button onclick="${() =>
      console.log("world")}" title="test">Or here</button>
      <div>
        <div>${content}</div>
      </div>
      <aside>
        ${html`<p>this is a test</p>`}
      </aside>
    `);
  }

  static observedAttributes = ["test"];

  attributeChangedCallback(name, prev, next) {
    if (prev === next) return;
    if (name === "test") {
      this.#test.value++;
    }
  }
}

customElements.define("my-component", MyComponent);
