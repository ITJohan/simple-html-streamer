import { HTMLGenerator, SupportedValue } from "./types.ts";

const isHTMLGenerator = (value: unknown): value is HTMLGenerator =>
  Object.prototype.toString.call(value) === "[object Generator]";

export const escapeHTML = (string: string): string => {
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

function* processValue(value: SupportedValue): HTMLGenerator {
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

export function* html(
  strings: TemplateStringsArray,
  ...values: SupportedValue[]
): HTMLGenerator {
  for (let i = 0; i < strings.length; i++) {
    yield strings[i];
    if (i < values.length) {
      yield* processValue(values[i]);
    }
  }
}

function* generateInjectionScript(
  id: string,
  content: HTMLGenerator,
): HTMLGenerator {
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

export const suspend = (
  placeholderGenerator: HTMLGenerator,
  contentGeneratorPromise: Promise<HTMLGenerator>,
): Promise<HTMLGenerator> => {
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

export const stream = (
  generator: HTMLGenerator,
): ReadableStream<Uint8Array> => {
  let isCanceled = false;

  return new ReadableStream({
    async start(controller) {
      const processShell = async (
        generator: HTMLGenerator,
        controller: ReadableStreamDefaultController<Uint8Array>,
      ): Promise<void> => {
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

      const processPromise = async (
        promise: Promise<string | number | boolean | HTMLGenerator>,
        controller: ReadableStreamDefaultController<Uint8Array>,
        encoder: TextEncoder,
      ): Promise<void> => {
        if (isCanceled) return;

        const nestedPromises: Promise<void>[] = [];
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

export const registerIslands = (
  basePath: string,
  relativePath: string,
): HTMLGenerator => {
  let directory;
  try {
    directory = Deno.readDirSync(new URL(relativePath, basePath).pathname);
  } catch (error) {
    console.error("Could not find directory:", error);
    throw new Error("Could not find directory");
  }

  const islands = [];
  for (const file of directory) {
    if (file.isFile && file.name.endsWith(".js")) {
      islands.push(file.name.split(".")[0]);
    }
  }

  return html`
    <script>
    ${islands.map((island) =>
      html`
        if (document.querySelector('${island}')) import('${relativePath}${island}.js');
      `
    )}
    </script>
  `;
};
