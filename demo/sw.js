import { html, stream, suspend } from "../html-streamer.js";

/**
 * @param {ReturnType<html>} placeholder
 * @param {ReturnType<html>} loaded
 * @param {ReturnType<html>} error
 * @returns {ReturnType<suspend>}
 */
const delayedComponent = (placeholder, loaded, error) => {
  return suspend(
    placeholder,
    new Promise((resolve, reject) => {
      setTimeout(
        () => Math.random() > 0.5 ? resolve(loaded) : reject(error),
        Math.random() * 3000,
      );
    }),
  );
};

self.addEventListener("fetch", (event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event);

  const generator = html`
    <h1>This is the header loaded in the initial shell</h1>
    ${delayedComponent(
      html`
        <p>Loading #1 ⏳</p>
      `,
      html`
        <p>
          Loaded #1 ✅ ${delayedComponent(
            html`
              <p>Loading nested ⏳</p>
            `,
            html`
              <p>
                Loaded nested ✅ ${delayedComponent(
                  html`
                    <p>Loading deeply nested ⏳</p>
                  `,
                  html`
                    <p>Loaded deeply nested ✅</p>
                  `,
                  html`
                    <p>Error deeply nested ❌</p>
                  `,
                )}
              </p>
            `,
            html`
              <p>Error nested ❌</p>
            `,
          )}
        </p>
      `,
      html`
        <p>Error #1 ❌</p>
      `,
    )} ${delayedComponent(
      html`
        <p>Loading #2 ⏳</p>
      `,
      html`
        <p>Loaded #2 ✅</p>
      `,
      html`
        <p>Error #2 ❌</p>
      `,
    )} ${delayedComponent(
      html`
        <p>Loading #3 ⏳</p>
      `,
      html`
        <p>Loaded #3 ✅</p>
      `,
      html`
        <p>Error #3 ❌</p>
      `,
    )}
    <footer>This is the footer loaded in the initial shell</footer>
  `;
  const htmlStream = stream(generator);

  fetchEvent.respondWith(
    new Response(htmlStream, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );
});
