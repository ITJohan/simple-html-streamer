export function suspend(
  /** @type {HTMLStreamValues} */ placeholder,
  /** @type {Promise<HTMLStreamValues>} */ promise,
) {
  const p = promise.then((content) =>
    html`
      <p>${content}</p>
    `
  );
  // @ts-ignore: Initially displays the placeholder
  p[Symbol.toPrimitive] = html`
    ${placeholder}
  `;

  return p;
}

// TODO: support suspend
// TODO: check things recursively for array values

export async function* html(
  /** @type {TemplateStringsArray}  */ strings,
  /** @type {HTMLStreamValues[]} */ ...values
) {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i];
    if (values[i]) {
      const value = values[i];
      // @ts-ignore: Checking if AsyncGenerator
      if (typeof value[Symbol.asyncIterator] === "function") {
        // @ts-ignore: Nested html function
        yield* value;
      } else if (Array.isArray(value)) {
        for (const arrayValue of value) {
          // @ts-ignore: Checking if AsyncGenerator
          if (typeof arrayValue[Symbol.asyncIterator] === "function") {
            // @ts-ignore: Nested html function
            yield* arrayValue;
          } else {
            yield arrayValue;
          }
        }
      } else {
        yield value;
      }
    }
  }
}
