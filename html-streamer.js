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
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const value = values[i];
      if (isGenerator(value)) {
        for (const part of value) {
          result += part;
        }
      } else {
        result += String(value);
      }
    }
  }

  yield result;
}
