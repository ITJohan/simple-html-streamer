// @ts-check

/** @typedef {Signal | Computed | Node[] | string | number | EventListenerOrEventListenerObject} Value */

const TAGS_REGEX = /(<.*?>|(?<=>)(\s*)(.*?)(\s*)(?=<))/g;
const TAG_PARTS_REGEX =
  /(?<=<)[a-z0-9-]*(?=\s)|(?<=\s)[a-z0-9-]*(?=\=)|(?<=")[a-z0-9-]*(?=\")|(?<=<)[a-z0-9-]*(?=\>)/g;
const END_TAG_REGEX = /(?<=<\/)[a-z0-9-]*(?=>)/g;

/**
 * @param {TemplateStringsArray} chunks
 * @param  {...Value} values
 */
export const html = (chunks, ...values) => {
  // Build html string
  /** @type {Record<string, Value>} */
  const idToValueMap = {};
  let html = "";
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    const value = values[i];
    if (value) {
      const id = crypto.randomUUID();
      idToValueMap[id] = value;
      html += chunk + id;
    } else {
      html += chunk;
    }
  }

  // TODO: do not think we need tag, but can use element.localName
  /** @type {{tag: string; node: Node}[]} */
  const nodes = [];

  // Build elements
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
        if (value.value instanceof Array) {
          // Reactive nested html
          const nestedNodes = /** @type {Node[]} */ (value.value);
          for (const node of nestedNodes) {
            value.effect(() => value);
            nodes.push({ tag: node.nodeName.toLocaleLowerCase(), node });
          }
        } else {
          const textNode = document.createTextNode(value.value);
          value.effect(() => textNode.nodeValue = value.value);
          nodes.push({ tag: "text", node: textNode });
        }
      } else if (typeof value === "string") {
        const textNode = document.createTextNode(value);
        nodes.push({ tag: "text", node: textNode });
      } else if (typeof value === "number") {
        const textNode = document.createTextNode(String(value));
        nodes.push({ tag: "text", node: textNode });
      } else if (value instanceof Array) {
        for (const node of value) {
          nodes.push({ tag: "text", node });
        }
      } else {
        // Plain text between two tags
        const textNode = document.createTextNode(tag);
        nodes.push({ tag: "text", node: textNode });
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
        const valueOrId = tagParts[j + 1];
        const value = idToValueMap[valueOrId] ?? valueOrId;
        if (value instanceof Signal) {
          if (typeof value.value === "function") {
            value.effect(() =>
              element.addEventListener(attribute.split("on")[1], value.value)
            );
          } else {
            value.effect(() => element.setAttribute(attribute, value.value));
          }
        } else if (typeof value === "string") {
          element.setAttribute(attribute, value);
        } else if (typeof value === "number") {
          element.setAttribute(attribute, String(value));
        } else if (typeof value === "function") {
          element.addEventListener(attribute.split("on")[1], value);
        }
      }
      nodes.push({ tag: tagParts[0], node: element });
    }
  }
  return nodes.map((node) => node.node);
};

export class Signal extends EventTarget {
  #value;

  constructor(value) {
    super();
    this.#value = value;
  }

  get value() {
    return this.#value;
  }

  set value(value) {
    if (this.#value === value) return;
    this.#value = value;
    this.dispatchEvent(new CustomEvent("change"));
  }

  effect(fn) {
    fn();
    this.addEventListener("change", fn);
    return () => this.removeEventListener("change", fn);
  }
}

export class Computed extends Signal {
  constructor(fn, deps) {
    super(fn(...deps));
    for (const dep of deps) {
      if (dep instanceof Signal) {
        dep.addEventListener("change", () => this.value = fn(...deps));
      }
    }
  }
}
