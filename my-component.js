// @ts-check

import { CustomElement } from "./custom-element.js";
import { Computed, Signal } from "./signal.js";

class MyComponent extends CustomElement {
  constructor() {
    super();

    const test = new Signal(1);
    const role = new Signal("heading");
    const toogle = new Signal(true);
    // TODO: content is not showing
    const content = new Computed(
      () => {
        return toogle.value
          ? this.html`<p>this is true</p>`
          : this.html`<p>this is false</p>`;
      },
      [toogle],
    );
    const liTest = new Signal(666);
    const test2 = new Signal(4);
    const items = [test2, new Signal(5), new Signal(6)].map((num) =>
      this.html`<li test=${liTest}>${num}</li>`
    );
    const onClick = new Signal(() => toogle.value = !toogle.value);
    const title = new Computed(() => `hello ${test.value}`, [test]);

    this.createTemplate`
      <h1 test="${test}" role="heading">${title}</h1>
      <button onclick="${onClick}" title="test">Click here</button>
      <div>
        <p>${content.value}</p>
      </div>
    `;

    /**
     * IDEA: we switch the passed in values with ids, and just parse the html with attributes and everything.
     *
     * "@click" can be replaced with on:click or something.
     */
    // this.render(this.html`
    //   <h1 test=${test} role=${role}>${title}</h1>
    //   <button @click=${onClick} title="test">Click here</button>
    //   ${content.value}
    //   <ul>
    //     ${items}
    //   </ul>
    // `);
  }

  static observedAttributes = ["test"];

  attributeChangedCallback(name, prev, next) {
    if (prev === next) return;
  }
}

customElements.define("my-component", MyComponent);
