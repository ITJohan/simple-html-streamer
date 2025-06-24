const encoder = new TextEncoder();

async function pipeValue(
  /**
   * @type {{
   *  value: any;
   *  controller: ReadableStreamDefaultController<Uint8Array>;
   * }}
   */ {
    value,
    controller,
  },
) {
  if (value === null || value === undefined || value === false) {
    return;
  }

  if (value instanceof Promise) {
    const resolvedValue = await value;
    await pipeValue({ value: resolvedValue, controller });
    return;
  }

  if (value instanceof ReadableStream) {
    const reader = value.getReader();
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      controller.enqueue(chunk);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      await pipeValue({ value: item, controller });
    }
    return;
  }

  controller.enqueue(encoder.encode(String(value)));
}

export function html(
  /** @type {TemplateStringsArray}  */ strings,
  /** @type {...any} */ ...values
) {
  /** @type {ReadableStream<Uint8Array>} */
  const stream = new ReadableStream({
    start: async (controller) => {
      try {
        for (let i = 0; i < strings.length; i++) {
          controller.enqueue(encoder.encode(strings[i]));

          if (i < values.length) {
            await pipeValue({ value: values[i], controller });
          }
        }
        controller.close();
      } catch (error) {
        console.error("Error in streaming template:", error);
        controller.error(error);
      }
    },
  });

  return stream;
}
