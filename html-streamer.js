/**
 * @param {any} value
 * @returns {value is Generator<string, void, unknown>}
 */
export function isGenerator(value) {
  return value.toString() === "[object Generator]";
}

/**
 * @param {TemplateStringsArray} strings
 * @param  {(
 *  string |
 *  number |
 *  boolean |
 *  Generator<string, void, unknown> |
 *  Generator<string, void, unknown>[] |
 *  Promise<Generator<string, void, unknown>>)[]} values
 * @returns {Generator<string, void, unknown>}
 */
export function* html(strings, ...values) {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i];
    if (i < values.length) {
      const value = values[i];
      if (isGenerator(value)) {
        for (const chunk of value) {
          yield chunk;
        }
      } else if (Array.isArray(value)) {
        for (const part of value) {
          for (const chunk of part) {
            yield chunk;
          }
        }
      } else {
        yield String(value);
      }
    }
  }
}

/**
 * @param {ReturnType<html>} placeholderGenerator
 * @param {Promise<ReturnType<html>>} contentGeneratorPromise
 * @returns {Promise<ReturnType<html>>} Promise with toPrimite function
 */
export function suspend(placeholderGenerator, contentGeneratorPromise) {
  const p = contentGeneratorPromise.then(function* (content) {
    yield* content;
  });
  // @ts-ignore: Hack for showing placeholder in templates
  p[Symbol.toPrimitive] = () => {
    let placeholder = "";
    for (const chunk of placeholderGenerator) {
      placeholder += chunk;
    }
    return placeholder;
  };
  return p;
}
