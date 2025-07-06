/**
 * @param {any} value
 * @returns {value is Generator<string, void, unknown>}
 */
export const isGenerator = (value) => value.toString() === "[object Generator]";

/**
 * @param {TemplateStringsArray} strings
 * @param  {(
 *  string |
 *  number |
 *  boolean |
 *  Generator<string | Promise<any>, void, unknown> |
 *  Generator<string | Promise<any>, void, unknown>[] |
 *  Promise<any>)[]} values
 * @returns {Generator<string | Promise<any>, void, unknown>}
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
        if (value instanceof Promise) {
          yield value;
        }
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
export const suspend = (placeholderGenerator, contentGeneratorPromise) => {
  const streamId = crypto.randomUUID();
  const p = contentGeneratorPromise.then(function* (content) {
    yield* html`
      <template id="content-${streamId}">
        ${content}
      </template>
      <script>
      (function() {
        const content = document.getElementById('content-${streamId}');
        const placeholder = document.getElementById('placeholder-${streamId}');
        if (content && placeholder) {
          placeholder.replaceWith(content.content.cloneNode(true));
          content.remove();
          document.currentScript.remove();
        }
      })()
      </script>
    `;
  }).catch(function* (content) {
    yield* html`
      <template id="content-${streamId}">
        ${content}
      </template>
      <script>
      (function() {
        const content = document.getElementById('content-${streamId}');
        const placeholder = document.getElementById('placeholder-${streamId}');
        if (content && placeholder) {
          placeholder.replaceWith(content.content.cloneNode(true));
          content.remove();
          document.currentScript.remove();
        }
      })()
      </script>
    `;
  });

  // @ts-ignore: Hack for showing placeholder in templates
  p[Symbol.toPrimitive] = () => {
    let placeholder = "";
    for (const chunk of placeholderGenerator) {
      placeholder += chunk;
    }
    return `<div id="placeholder-${streamId}">${placeholder}</div>`;
  };

  return p;
};

/**
 * @param {ReturnType<html>} generator
 */
export const stream = (generator) => {
  /** @type {Promise<void>[]} */
  const promises = [];
  const encoder = new TextEncoder();
  /** @type {ReadableStream<Uint8Array>} */ const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of generator) {
        if (chunk instanceof Promise) {
          const processPromise = async () => {
            try {
              const resolvedContentGenerator = await chunk;
              for (const contentChunk of resolvedContentGenerator) {
                controller.enqueue(encoder.encode(contentChunk));
              }
            } catch (error) {
              if (isGenerator(error)) {
                for (const errorChunk of error) {
                  controller.enqueue(encoder.encode(errorChunk));
                }
              }
            }
          };
          promises.push(processPromise());
        } else {
          controller.enqueue(encoder.encode(chunk));
        }
      }

      await Promise.all(promises);

      controller.close();
    },
  });
  return stream;
};
