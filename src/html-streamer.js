/**
 * @typedef {(Generator<
 *  (
 *    | string | number | boolean
 *    | Promise<string | number | boolean | HTMLGenerator>
 *  ),
 *  void,
 *  unknown
 * >)} HTMLGenerator
 */

/**
 * @typedef {(
 *  | (string | number | boolean | HTMLGenerator)
 *  | (string | number | boolean | HTMLGenerator)[]
 *  | Promise<(string | number | boolean | HTMLGenerator)>
 *  | Promise<(string | number | boolean | HTMLGenerator)>[]
 * )} SupportedValue
 */

/**
 * @param {any} value
 * @returns {value is HTMLGenerator}
 */
const isHTMLGenerator = (value) => value.toString() === "[object Generator]";

/**
 * @param {string} string
 * @returns {string}
 */
export const escapeHTML = (string) => {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * @param {SupportedValue} value
 * @returns {HTMLGenerator}
 */
function* processValue(value) {
  if (isHTMLGenerator(value)) {
    const generator = value;
    for (const chunk of generator) {
      yield* processValue(chunk);
    }
  } else if (Array.isArray(value)) {
    const array = value;
    for (const item of array) {
      yield* processValue(item);
    }
  } else {
    yield value;
  }
}

/**
 * @param {TemplateStringsArray} strings
 * @param  {SupportedValue[]} values
 * @returns {HTMLGenerator}
 */
export function* html(strings, ...values) {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i];
    if (i < values.length) {
      yield* processValue(values[i]);
    }
  }
}

/**
 * @param {string} id
 * @param {HTMLGenerator} content
 * @returns {HTMLGenerator}
 */
function* generateInjectionScript(id, content) {
  yield* html`
    <template id="content-${id}">
      ${content}
    </template>
    <script>
    (function() {
      const content = document.getElementById('content-${id}');
      const placeholder = document.getElementById('placeholder-${id}');
      if (content && placeholder) {
        placeholder.replaceWith(content.content.cloneNode(true));
        content.remove();
        document.currentScript.remove();
      }
    })()
    </script>
  `;
}

/**
 * @param {HTMLGenerator} placeholderGenerator
 * @param {Promise<HTMLGenerator>} contentGeneratorPromise
 * @returns {Promise<HTMLGenerator>} Promise with toPrimitive function
 */
export const suspend = (placeholderGenerator, contentGeneratorPromise) => {
  const streamId = crypto.randomUUID();
  const contentPromiseWithToPrimitive = contentGeneratorPromise.then(
    function* (content) {
      yield* generateInjectionScript(streamId, content);
    },
  ).catch(
    function* (content) {
      yield* generateInjectionScript(streamId, content);
    },
  );

  // @ts-ignore: Hack for showing placeholder when promise is used as a string
  contentPromiseWithToPrimitive[Symbol.toPrimitive] = () => {
    let placeholder = "";
    for (const chunk of placeholderGenerator) {
      placeholder += chunk;
    }
    return `<div id="placeholder-${streamId}">${placeholder}</div>`;
  };

  return contentPromiseWithToPrimitive;
};

/**
 * @param {HTMLGenerator} generator
 * @returns {ReadableStream<Uint8Array>}
 */
export const stream = (generator) => {
  let isCanceled = false;

  return new ReadableStream({
    async start(controller) {
      /**
       * @param {HTMLGenerator} generator
       * @param {ReadableStreamDefaultController<Uint8Array>} controller
       * @returns {Promise<void>}
       */
      const processShell = async (generator, controller) => {
        if (isCanceled) return;

        /** @type {Promise<void>[]} */
        const promises = [];
        const encoder = new TextEncoder();

        for (const chunk of generator) {
          if (chunk instanceof Promise) {
            promises.push(processPromise(chunk, controller, encoder));
          }
          controller.enqueue(encoder.encode(String(chunk)));
        }

        await Promise.all(promises);
      };

      /**
       * @param {Promise<string | number | boolean | HTMLGenerator>} promise
       * @param {ReadableStreamDefaultController<Uint8Array>} controller
       * @param {TextEncoder} encoder
       * @returns {Promise<void>}
       */
      const processPromise = async (promise, controller, encoder) => {
        if (isCanceled) return;

        /** @type {Promise<void>[]} */
        const nestedPromises = [];
        try {
          const value = await promise;
          if (isHTMLGenerator(value)) {
            const generator = value;
            for (const chunk of generator) {
              if (chunk instanceof Promise) {
                nestedPromises.push(processPromise(chunk, controller, encoder));
              }
              controller.enqueue(encoder.encode(String(chunk)));
            }
          }
        } catch (error) {
          if (isHTMLGenerator(error)) {
            const generator = error;
            for (const chunk of generator) {
              if (chunk instanceof Promise) {
                nestedPromises.push(processPromise(chunk, controller, encoder));
              }
              controller.enqueue(encoder.encode(String(chunk)));
            }
          }
        } finally {
          await Promise.all(nestedPromises);
        }
      };

      await processShell(generator, controller);

      if (isCanceled) return;
      controller.close();
    },
    cancel() {
      isCanceled = true;
    },
  });
};

/**
 * @param {string} path
 * @returns {Promise<HTMLGenerator>}
 */
export const registerIslands = async (path) => {
  let directory;
  try {
    directory = Deno.readDir(path);
  } catch (error) {
    console.error("Could not find directory:", error);
    throw new Error("Could not find directory");
  }

  const islands = [];
  for await (const file of directory) {
    if (file.isFile && file.name.endsWith(".js")) {
      islands.push(file.name.split(".")[0]);
    }
  }

  return html`
    <script type="module">
    ${islands.map((island) =>
      html`
        if (document.querySelector('${island}')) import('${path}${island}.js');
      `
    )}
    </script>
  `;
};
