// @ts-check

import { Computed, Signal } from "./signal.js";

/**
 * @typedef {{
 *  attributes: {name: string; id: string; signal: Signal}[];
 *  events: {name: string; id: string; signal: Signal}[];
 *  texts: {id: string; signal: Signal}[];
 *  nested: Fragments[];
 *  html: string;
 * }} Fragments
 */

export class CustomElement extends HTMLElement {
  /** @type {ShadowRoot} */
  shadow;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
  }

  /**
   * @param {TemplateStringsArray} chunks
   * @param  {...(Signal | Computed | HTMLElement | string | number )} values
   */
  createTemplate(chunks, ...values) {
    /** @type {Record<string, any>} */
    const idToValueMap = {};
    let html = "";
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const value = values[i];
      const id = crypto.randomUUID();
      idToValueMap[id] = value;
      html += chunk + id;
    }

    const matches = html.match(/(<.*?>|(?<=>)(.*?)(?=<))/g);
    if (matches === null) throw new Error("match is null.");
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const result = match.match(
        /(?<=<)[a-z0-9-]*(?=\s)|(?<=\s)[a-z0-9-]*(?=\=)|(?<=")[a-z0-9-]*(?=\")/g,
      );
      if (result) {
        // TODO: tag
      } else {
        // TODO: text
      }
    }
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
      text.signal.effect(() => element.innerHTML = text.signal.value);
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
          case "object": {
            // Nested template
            const nestedTemplate = /** @type {Fragments} */ (value.value);
            // fragments.attributes.push(...nestedTemplate.attributes);
            // fragments.events.push(...nestedTemplate.events);
            // fragments.texts.push(...nestedTemplate.texts);
            // TODO: add id to chunk and save the nested template?

            fragments.html += chunk;
            // fragments.html += nestedTemplate.html;
            break;
          }
        }
      } else {
        if (value === undefined) {
          // End
          fragments.html += chunk;
        } else if (value instanceof Array) {
          // Nested template array
          const nestedTemplates = /** @type {Fragments[]} */ (value);
          fragments.html += chunk;
          for (const nestedTemplate of nestedTemplates) {
            fragments.attributes.push(...nestedTemplate.attributes);
            fragments.events.push(...nestedTemplate.events);
            fragments.texts.push(...nestedTemplate.texts);
            fragments.html += nestedTemplate.html;
          }
        } else {
          throw new Error(
            `Unhandled case: ${JSON.stringify({ chunk, value })}`,
          );
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
