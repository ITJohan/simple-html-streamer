// @ts-check

import { Computed, html, Signal } from "./html.js";

class MyComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });

    const test = new Signal(1);
    const toogle = new Signal(true);
    const content = new Computed(
      () => {
        return toogle.value ? "<p>this is true</p>" : "<p>this is false</p>";
      },
      [toogle],
    );
    const liTest = new Signal(666);
    const test2 = new Signal(4);
    const items = [test2, new Signal(5), new Signal(6)].map((num) =>
      `<li test=${liTest}>${num}</li>`
    );
    const onClick = new Signal(() => test.value++);
    const title = new Computed(() => `hello ${test.value}`, [test]);

    shadow.append(...html`
      <h1 test="${test}" role="heading">${title}</h1>
      <button onclick="${onClick}" title="test">Click here</button>
      <button onclick="${() =>
      console.log("world")}" title="test">Or here</button>
      <div>
        <p>${content.value}</p>
      </div>
      <aside>
        ${html`<p>this is a test</p>`}
      </aside>
    `);
  }

  static observedAttributes = ["test"];

  attributeChangedCallback(name, prev, next) {
    if (prev === next) return;
  }
}

customElements.define("my-component", MyComponent);
