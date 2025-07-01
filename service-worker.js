import AppRouter from "./app-router.js";
import { html, suspend } from "./html-streamer.js";

self.addEventListener("install", (event) => {
  const extendableEvent = /** @type {ExtendableEvent} */ (event);
});

self.addEventListener("activate", (event) => {
  const extendableEvent = /** @type {ExtendableEvent} */ (event);
});

const router = new AppRouter();

router.get("/", () => {
  const card = () =>
    html`
      <article>this is a card</article>
    `;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = html`
        <h1>hello world</h1>
        ${html`
          <p>Hello there</p>
          ${card()}
          <ul>
            ${[1, 2, 3].map((val) =>
              html`
                <li>${val}</li>
              `
            )}
          </ul>
        `}
        <footer>Footer</footer>
        ${"a nested text"} ${`<h1>${666}</h1>`} ${true} ${card()}
      `;
      for await (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

self.addEventListener("fetch", (event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event);

  const response = router.handle(fetchEvent);
  if (response) {
    fetchEvent.respondWith(response);
  }
});
