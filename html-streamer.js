/**
 * @param {any} value
 * @returns {value is Generator<string, void, unknown>}
 */
function isGenerator(value) {
  return value.toString() === "[object Generator]";
}

/**
 * @param {ReturnType<html>} generator
 * @returns {string}
 */
function consumeGenerator(generator) {
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }
  return result;
}

/**
 * @param {TemplateStringsArray} strings
 * @param  {(
 *  string |
 *  number |
 *  boolean |
 *  Generator<string, void, unknown> |
 *  Generator<string, void, unknown>[] |
 *  Promise<string>)[]} values
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
 * @param {ReturnType<html>} placeholder
 * @param {Promise<ReturnType<html>>} promise
 * @returns {Promise<string>} Promise with toPrimite function
 */
export function suspend(placeholder, promise) {
  const p = promise.then((content) => consumeGenerator(content));
  // @ts-ignore: Hack for showing placeholder in templates
  p[Symbol.toPrimitive] = () => consumeGenerator(placeholder);
  return p;
}
