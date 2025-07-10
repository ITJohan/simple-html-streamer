import { html, stream, suspend } from "./html-streamer.js";

self.addEventListener("fetch", (event) => {
  const fetchEvent = /** @type {FetchEvent} */ (event);
  const url = new URL(fetchEvent.request.url);

  if (url.pathname === "/" && fetchEvent.request.method === "GET") {
    const generator = html`
      <h1>This is the header loaded in the initial shell</h1>
      ${suspend(
        html`
          <p>Loading #1 ⏳</p>
        `,
        new Promise((resolve) =>
          setTimeout(() =>
            resolve(html`
              <p>
                Loaded #1 ✅ ${suspend(
                  html`
                    <span>Loading nested⏳</span>
                  `,
                  new Promise((resolve) =>
                    setTimeout(() =>
                      resolve(html`
                        <div>
                          Loaded nested✅ ${suspend(
                            html`
                              <p>Loading deeply nested⏳</p>
                            `,
                            new Promise((resolve) =>
                              setTimeout(() =>
                                resolve(html`
                                  <p>Loaded deeply nested✅</p>
                                `), Math.random() * 1000)
                            ),
                          )}
                        </div>
                      `), Math.random() * 1000)
                  ),
                )}
              </p>
            `), Math.floor(Math.random() * 3000))
        ),
      )} ${suspend(
        html`
          <p>Loading #2 ⏳</p>
        `,
        new Promise((resolve, reject) =>
          setTimeout(() =>
            Math.random() > 0.5
              ? resolve(html`
                <p>Loaded #2 ✅</p>
              `)
              : reject(html`
                <p>Error #2 ❌</p>
              `), Math.floor(Math.random() * 3000))
        ),
      )} ${suspend(
        html`
          <p>Loading #3 ⏳</p>
        `,
        new Promise((resolve, reject) =>
          setTimeout(() =>
            Math.random() > 0.5
              ? resolve(html`
                <p>Loaded #3 ✅</p>
              `)
              : reject(html`
                <p>Error #3 ❌</p>
              `), Math.floor(Math.random() * 3000))
        ),
      )} ${suspend(
        html`
          <p>Loading #4 ⏳</p>
        `,
        new Promise((resolve, reject) =>
          setTimeout(() =>
            Math.random() > 0.5
              ? resolve(html`
                <p>Loaded #4 ✅</p>
              `)
              : reject(html`
                <p>Error #4 ❌</p>
              `), Math.floor(Math.random() * 3000))
        ),
      )}${suspend(
        html`
          <p>Loading #5 ⏳</p>
        `,
        new Promise((resolve, reject) =>
          setTimeout(() =>
            Math.random() > 0.5
              ? resolve(html`
                <p>Loaded #5 ✅</p>
              `)
              : reject(html`
                <p>Error #5 ❌</p>
              `), Math.floor(Math.random() * 3000))
        ),
      )}${suspend(
        html`
          <p>Loading #6 ⏳</p>
        `,
        new Promise((resolve, reject) =>
          setTimeout(() =>
            Math.random() > 0.5
              ? resolve(html`
                <p>Loaded #6 ✅</p>
              `)
              : reject(html`
                <p>Error #6 ❌</p>
              `), Math.floor(Math.random() * 3000))
        ),
      )}
      <footer>This is the footer loaded in the initial shell</footer>
    `;
    const htmlStream = stream(generator);

    fetchEvent.respondWith(
      new Response(htmlStream, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }),
    );
  }
});
