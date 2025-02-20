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

/** @typedef {Signal | Computed | Node | string | number | EventListenerOrEventListenerObject} Value */

const TAGS_REGEX = /(<.*?>|(?<=>)(.*?)(?=<))/g;
const TAG_PARTS_REGEX =
  /(?<=<)[a-z0-9-]*(?=\s)|(?<=\s)[a-z0-9-]*(?=\=)|(?<=")[a-z0-9-]*(?=\")|(?<=<)[a-z0-9-]*(?=\>)/g;
const END_TAG_REGEX = /(?<=<\/)[a-z0-9-]*(?=>)/g;

export class CustomElement {
  /**
   * @param {TemplateStringsArray} chunks
   * @param  {...Value} values
   */
  createTemplate(chunks, ...values) {
    // Build html string
    /** @type {Record<string, Value>} */
    const idToValueMap = {};
    let html = "";
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const value = values[i];
      const id = crypto.randomUUID();
      idToValueMap[id] = value;
      html += chunk + id;
    }

    // TODO: do not think we need tag, but can use element.localName
    /** @type {{tag: string; node: Node}[]} */
    const nodes = [];

    // Build elements
    // TODO: attribute values part of chunks are not respected
    const tags = html.match(TAGS_REGEX);
    if (tags === null) throw new Error("match is null.");
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const tagParts = tag.match(TAG_PARTS_REGEX);
      const endTag = tag.match(END_TAG_REGEX);

      if (endTag) {
        // Search for matching start tag and save child nodes on the way
        let startNode = undefined;
        const childNodes = [];
        for (let j = nodes.length - 1; j >= 0; j--) {
          const node = nodes[j];
          if (node.tag === endTag[0]) {
            startNode = node;
            j = 0;
          } else {
            childNodes.push(node);
            nodes.splice(j, 1);
          }
        }
        // Append child nodes to start tag
        for (let j = 0; j < childNodes.length; j++) {
          startNode?.node.appendChild(childNodes[j].node);
        }
      } else if (tagParts === null) {
        // Between to tags
        const value = idToValueMap[tag];
        if (value instanceof Signal || value instanceof Computed) {
          const textNode = document.createTextNode(value.value);
          value.effect(() => textNode.nodeValue = value.value);
          nodes.push({ tag: "text", node: textNode });
        } else if (typeof value === "string") {
          const textNode = document.createTextNode(value);
          nodes.push({ tag: "text", node: textNode });
        } else if (typeof value === "number") {
          const textNode = document.createTextNode(String(value));
          nodes.push({ tag: "text", node: textNode });
        } else if (value instanceof HTMLElement) {
          nodes.push({ tag: "text", node: value });
        }
      } else if (tagParts.length === 1) {
        // Tag without attributes
        const element = document.createElement(tagParts[0]);
        nodes.push({ tag: tagParts[0], node: element });
      } else {
        // Tag with attributes
        const element = document.createElement(tagParts[0]);
        for (let j = 1; j < tagParts.length; j += 2) {
          const attribute = tagParts[j];
          const value = idToValueMap[tagParts[j + 1]];
          if (value instanceof Signal) {
            if (typeof value.value === "function") {
              value.effect(() =>
                element.addEventListener(attribute.split("on")[1], value.value)
              );
            } else {
              element.setAttribute(attribute, value.value);
            }
          }
          if (typeof value === "string") {
            element.setAttribute(attribute, value);
          }
          if (typeof value === "number") {
            element.setAttribute(attribute, String(value));
          }
          if (typeof value === "function") {
            element.addEventListener(attribute.split("on")[1], value);
          }
        }
        nodes.push({ tag: tagParts[0], node: element });
      }
    }
    return nodes.map((node) => node.node);
  }

  // /**
  //  * @param {Fragments} fragments
  //  */
  // #build(fragments) {
  //   this.shadow.innerHTML = fragments.html;

  //   for (const attribute of fragments.attributes) {
  //     const element = this.shadow.querySelector(`[${attribute.id}]`);
  //     if (element === null || !(element instanceof HTMLElement)) {
  //       throw new Error("Element not found.");
  //     }
  //     element.removeAttribute(attribute.id);
  //     attribute.signal.effect(() =>
  //       element.setAttribute(attribute.name, attribute.signal.value)
  //     );
  //   }

  //   for (const event of fragments.events) {
  //     const element = this.shadow.querySelector(`[${event.id}]`);
  //     if (element === null || !(element instanceof HTMLElement)) {
  //       throw new Error("Element not found.");
  //     }
  //     element.removeAttribute(event.id);
  //     event.signal.effect(() =>
  //       element.addEventListener(event.name, event.signal.value)
  //     );
  //   }

  //   for (const text of fragments.texts) {
  //     const element = this.shadow.querySelector(`[${text.id}]`);
  //     if (element === null || !(element instanceof HTMLElement)) {
  //       throw new Error("Element not found.");
  //     }
  //     element.removeAttribute(text.id);
  //     text.signal.effect(() => element.innerHTML = text.signal.value);
  //   }
  // }

  // /**
  //  * Parses a tagged template string into a template
  //  * @param {TemplateStringsArray} chunks
  //  * @param  {...any} values
  //  */
  // html(chunks, ...values) {
  //   /** @type {Fragments} */
  //   const fragments = {
  //     attributes: [],
  //     events: [],
  //     texts: [],
  //     html: "",
  //   };

  //   for (let i = 0; i < chunks.length; i++) {
  //     const chunk = chunks[i].trim();
  //     const value = values[i];

  //     if (value instanceof Signal || value instanceof Computed) {
  //       switch (typeof value.value) {
  //         case "function": {
  //           // TODO: can match be replaced by replace with callback?
  //           const event = chunk.match(/@(\w+)=/);
  //           if (event) {
  //             // Event handler
  //             const name = event[1];
  //             const id = `id-${crypto.randomUUID()}`;

  //             fragments.events.push({ name, id, signal: value });

  //             const updatedChunk = chunk.replace(event[0], `${id} `);
  //             fragments.html += updatedChunk;
  //           }
  //           break;
  //         }
  //         case "number":
  //         case "string": {
  //           // TODO: can match be replaced by replace with callback?
  //           const attribute = chunk.match(/(\w+)=/);
  //           if (attribute) {
  //             // Attribute
  //             const name = attribute[1];
  //             const id = `id-${crypto.randomUUID()}`;

  //             fragments.attributes.push({ name, id, signal: value });

  //             const updatedChunk = chunk.replace(attribute[0], `${id} `);
  //             fragments.html += updatedChunk;
  //           } else {
  //             // Text node
  //             fragments.html += chunk.replace(
  //               />(?!.*<)(.*)/,
  //               (_match, ...args) => {
  //                 const id = `id-${crypto.randomUUID()}`;
  //                 fragments.texts.push({ id, signal: value });
  //                 return ` ${id}>`;
  //               },
  //             );
  //           }
  //           break;
  //         }
  //         case "object": {
  //           // Nested template
  //           const nestedTemplate = /** @type {Fragments} */ (value.value);
  //           // fragments.attributes.push(...nestedTemplate.attributes);
  //           // fragments.events.push(...nestedTemplate.events);
  //           // fragments.texts.push(...nestedTemplate.texts);
  //           // TODO: add id to chunk and save the nested template?

  //           fragments.html += chunk;
  //           // fragments.html += nestedTemplate.html;
  //           break;
  //         }
  //       }
  //     } else {
  //       if (value === undefined) {
  //         // End
  //         fragments.html += chunk;
  //       } else if (value instanceof Array) {
  //         // Nested template array
  //         const nestedTemplates = /** @type {Fragments[]} */ (value);
  //         fragments.html += chunk;
  //         for (const nestedTemplate of nestedTemplates) {
  //           fragments.attributes.push(...nestedTemplate.attributes);
  //           fragments.events.push(...nestedTemplate.events);
  //           fragments.texts.push(...nestedTemplate.texts);
  //           fragments.html += nestedTemplate.html;
  //         }
  //       } else {
  //         throw new Error(
  //           `Unhandled case: ${JSON.stringify({ chunk, value })}`,
  //         );
  //       }
  //     }
  //   }

  //   return fragments;
  // }

  // /**
  //  * @param {Fragments} fragments
  //  */
  // render(fragments) {
  //   this.#build(fragments);
  // }
}
