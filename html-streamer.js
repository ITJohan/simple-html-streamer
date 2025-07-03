/**
 * @param {any} value
 * @returns {value is Generator<string, void, unknown>}
 */
function isGenerator(value) {
  return value.toString() === "[object Generator]";
}

/**
 * @param {TemplateStringsArray} strings
 * @param  {(string | number | boolean | Generator<string, void, unknown>)[]} values
 */
export function* html(strings, ...values) {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i];
    if (i < values.length) {
      const value = values[i];
      if (isGenerator(value)) {
        for (const part of value) {
          yield part;
        }
      } else {
        yield String(value);
      }
    }
  }
}
