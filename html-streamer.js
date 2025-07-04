/**
 * @param {any} value
 * @returns {value is Generator<string, void, unknown>}
 */
function isGenerator(value) {
  return value.toString() === "[object Generator]";
}

/**
 * @param {TemplateStringsArray} strings
 * @param  {(string | number | boolean | Generator<string, void, unknown> | Generator<string, void, unknown>[])[]} values
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
