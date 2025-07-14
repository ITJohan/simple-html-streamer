/** @typedef {Generator<string | Promise<any>, void, unknown>} HTMLGenerator */

/**
 * @param {any} value
 * @returns {value is HTMLGenerator}
 */
export const isGenerator = (value) => value.toString() === "[object Generator]";

/**
 * @param {TemplateStringsArray} strings
 * @param  {(
 *  string |
 *  number |
 *  boolean |
 *  HTMLGenerator |
 *  HTMLGenerator[] |
 *  Promise<any>)[]} values
 * @returns {HTMLGenerator}
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
      } else if (value instanceof Promise) {
        yield value;
      } else {
        yield String(value);
      }
    }
  }
}

/**
 * @param {HTMLGenerator} placeholderGenerator
 * @param {Promise<HTMLGenerator>} contentGeneratorPromise
 * @returns {Promise<HTMLGenerator>} Promise with toPrimite function
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
 * @param {HTMLGenerator} generator
 */
export const stream = (generator) => {
  let isCancelled = false;
  /** @type {Promise<void>[]} */
  const promises = [];
  const encoder = new TextEncoder();
  /** @type {ReadableStream<Uint8Array>} */
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of generator) {
        if (chunk instanceof Promise) {
          /** @param {Promise<any>} chunk */
          const processPromise = async (chunk) => {
            /** @type {Promise<void>[]} */
            const nestedPromises = [];
            try {
              const resolvedContentGenerator = await chunk;
              for (const contentChunk of resolvedContentGenerator) {
                if (contentChunk instanceof Promise) {
                  nestedPromises.push(processPromise(contentChunk));
                }
                if (isCancelled) return;
                controller.enqueue(encoder.encode(contentChunk));
              }
              await Promise.all(nestedPromises);
            } catch (error) {
              // @ts-ignore: TODO: handle error type
              for (const errorChunk of error) {
                if (errorChunk instanceof Promise) {
                  nestedPromises.push(processPromise(errorChunk));
                }
                if (isCancelled) return;
                controller.enqueue(encoder.encode(errorChunk));
              }
              await Promise.all(nestedPromises);
            }
          };
          promises.push(processPromise(chunk));
          if (isCancelled) return;
          controller.enqueue(encoder.encode(String(chunk)));
        } else {
          if (isCancelled) return;
          controller.enqueue(encoder.encode(chunk));
        }
      }

      await Promise.all(promises);

      if (isCancelled) return;
      controller.close();
    },
    cancel() {
      isCancelled = true;
    },
  });
  return stream;
};
