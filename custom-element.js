// @ts-check

import { Computed, Signal } from "./signal.js";

/**
 * @typedef {{
 *  attributes: {name: string; id: string; signal: Signal}[];
 *  events: {name: string; id: string; signal: Signal}[];
 *  texts: {id: string; signal: Signal}[];
 *  html: string;
 * }} Fragments
 */

/**
 * @typedef {{
 *  attributes: {element: HTMLElement; attribute: string;}[];
 *  events: {element: HTMLElement; event: string;}[];
 *  texts: {element: HTMLElement;}[];
 * }} Template
 */

export class CustomElement extends HTMLElement {
  /** @type {Template} */
  #template;
  /** @type {ShadowRoot} */
  shadow;

  constructor() {
    super();
    this.#template = { attributes: [], events: [], texts: [] };
    this.shadow = this.attachShadow({ mode: "open" });
  }

  /**
   * @param {Fragments} fragments
   */
  #build(fragments) {
    this.shadow.innerHTML = fragments.html;

    for (const attribute of fragments.attributes) {
      const element = this.shadow.querySelector(`[${attribute.id}]`);
      if (element === null || !(element instanceof HTMLElement)) {
        throw new Error("Element not found.");
      }
      element.removeAttribute(attribute.id);
      attribute.signal.effect(() =>
        element.setAttribute(attribute.name, attribute.signal.value)
      );
      this.#template.attributes.push({ element, attribute: attribute.name });
    }

    for (const event of fragments.events) {
      const element = this.shadow.querySelector(`[${event.id}]`);
      if (element === null || !(element instanceof HTMLElement)) {
        throw new Error("Element not found.");
      }
      element.removeAttribute(event.id);
      event.signal.effect(() =>
        element.addEventListener(event.name, event.signal.value)
      );
    }

    for (const text of fragments.texts) {
      const element = this.shadow.querySelector(`[${text.id}]`);
      if (element === null || !(element instanceof HTMLElement)) {
        throw new Error("Element not found.");
      }
      element.removeAttribute(text.id);
      text.signal.effect(() => element.textContent = text.signal.value);
    }
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

      if (value instanceof Signal || value instanceof Computed) {
        switch (typeof value.value) {
          case "function": {
            // TODO: can match be replaced by replace with callback?
            const event = chunk.match(/@(\w+)=/);
            if (event) {
              // Event handler
              const name = event[1];
              const id = `id-${crypto.randomUUID()}`;

              fragments.events.push({ name, id, signal: value });

              const updatedChunk = chunk.replace(event[0], `${id} `);
              fragments.html += updatedChunk;
            }
            break;
          }
          case "number":
          case "string": {
            // TODO: can match be replaced by replace with callback?
            const attribute = chunk.match(/(\w+)=/);
            if (attribute) {
              // Attribute
              const name = attribute[1];
              const id = `id-${crypto.randomUUID()}`;

              fragments.attributes.push({ name, id, signal: value });

              const updatedChunk = chunk.replace(attribute[0], `${id} `);
              fragments.html += updatedChunk;
            } else {
              // Text node
              fragments.html += chunk.replace(
                />(?!.*<)(.*)/,
                (_match, ...args) => {
                  const id = `id-${crypto.randomUUID()}`;
                  fragments.texts.push({ id, signal: value });
                  return ` ${id}>`;
                },
              );
            }
            break;
          }
        }
      } else {
        if (value === undefined) {
          // End
          fragments.html += chunk;
        } else {
          // Nested template(s)
          // TODO: can these be combined?
          if (value instanceof Array) {
            const nestedTemplates = /** @type {Fragments[]} */ (value);
            fragments.html += chunk;
            for (const nestedTemplate of nestedTemplates) {
              fragments.attributes.push(...nestedTemplate.attributes);
              fragments.events.push(...nestedTemplate.events);
              fragments.texts.push(...nestedTemplate.texts);
              fragments.html += nestedTemplate.html;
            }
          } else {
            const nestedTemplate = /** @type {Fragments} */ (value);
            fragments.attributes.push(...nestedTemplate.attributes);
            fragments.events.push(...nestedTemplate.events);
            fragments.texts.push(...nestedTemplate.texts);
            fragments.html += chunk;
            fragments.html += nestedTemplate.html;
          }
        }
      }
    }

    return fragments;
  }

  /**
   * @param {Fragments} fragments
   */
  render(fragments) {
    this.#build(fragments);
  }
}
