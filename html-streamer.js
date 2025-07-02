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

export async function* html(
  /** @type {TemplateStringsArray}  */ strings,
  /** @type {HTMLStreamValues[]} */ ...values
) {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i];
    if (values[i]) {
      yield* yielder(values[i]);
    }
  }
}

/**
 * @param {HTMLStreamValues} value
 * @returns {AsyncGenerator<string, void, unknown>}
 */
export async function* yielder(/** @type {HTMLStreamValues} */ value) {
  // @ts-ignore: Check if AsyncGenerator
  if (typeof value[Symbol.asyncIterator] === "function") {
    // @ts-ignore: Nested AsyncGenerator
    yield* value;
  } else if (Array.isArray(value)) {
    // Loop through arrays recursively
    for (const arrayValue of value) {
      yield* yielder(arrayValue);
    }
  } else {
    // @ts-ignore: Handle other values
    yield value;
  }
}
