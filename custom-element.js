// @ts-check

/**
 * @typedef {{
 *  attributes: {name: string; id: string; value: string}[];
 *  events: {name: string; id: string; value: any}[];
 *  texts: {id: string; value: string}[];
 *  html: string;
 * }} Fragments
 */

/**
 * @typedef {{
 *  attributes: {element: HTMLElement; attribute: string;}[];
 *  events: {element: string; event: string;}[];
 *  texts: {element: string; text: string}[];
 * }} Template
 */

const template = document.createElement("template");

export class CustomElement extends HTMLElement {
  /** @type {ShadowRoot} */
  shadow;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  /**
   * @param {Fragments} fragments
   */
  #build(fragments) {
    template.innerHTML = fragments.html;
    this.shadow.appendChild(template.content.cloneNode(true));

    for (const attribute of fragments.attributes) {
      const element = this.shadow.querySelector(`[${attribute.id}]`);
      if (element === null) throw new Error("Element not found.");
      element.removeAttribute(attribute.id);
      element.setAttribute(attribute.name, attribute.value);
    }

    for (const event of fragments.events) {
      const element = this.shadow.querySelector(`[${event.id}]`);
      if (element === null) throw new Error("Element not found.");
      element.removeAttribute(event.id);
      element.addEventListener(event.name, event.value);
    }

    for (const text of fragments.texts) {
      const element = this.shadow.querySelector(`[${text.id}]`);
      if (element === null) throw new Error("Element not found.");
      element.removeAttribute(text.id);
      element.textContent = text.value;
    }

    console.log(this.shadow);
  }

  /**
   * Parses a tagged template string into a template
   * @param {TemplateStringsArray} chunks
   * @param  {...any} values
   */
  html(chunks, ...values) {
    /** @type {Fragments} */
    const fragments = {
      attributes: [],
      events: [],
      texts: [],
      html: "",
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      const value = values[i];

      switch (typeof value) {
        case "function": {
          const event = chunk.match(/@(\w+)=/);
          if (event) {
            // Event handler
            const name = event[1];
            const id = `id-${crypto.randomUUID()}`;

            fragments.events.push({ name, id, value });

            const updatedChunk = chunk.replace(event[0], `${id} `);
            fragments.html += updatedChunk;
          }
          break;
        }
        case "string": {
          const attribute = chunk.match(/(\w+)=/);
          if (attribute) {
            // Attribute
            const name = attribute[1];
            const id = `id-${crypto.randomUUID()}`;

            fragments.attributes.push({ name, id, value });

            const updatedChunk = chunk.replace(attribute[0], `${id} `);
            fragments.html += updatedChunk;
          } else {
            // Text node
            const match = chunk.match(/>(?!.*<)(.*)/);
            if (match) {
              const id = `id-${crypto.randomUUID()}`;
              fragments.texts.push({ id, value: `${match[1]} ${value}` });
              fragments.html += chunk.replace(/>(?!.*<)(.*)/, ` ${id}>`);
            }
          }

          break;
        }
        case "undefined": {
          // End
          fragments.html += chunk;
          break;
        }
        default: {
          // Neste template
          const nestedTemplate = /** @type {Fragments} */ (value);
          fragments.attributes.push(...nestedTemplate.attributes);
          fragments.events.push(...nestedTemplate.events);
          fragments.texts.push(...nestedTemplate.texts);
          fragments.html += chunk;
          fragments.html += nestedTemplate.html;
        }
      }
    }

    return fragments;
  }

  /**
   * @param {Fragments} fragments
   */
  render(fragments) {
    if (template.innerHTML === "") {
      this.#build(fragments);
    } else {
      // TODO: update?
    }
  }
}
