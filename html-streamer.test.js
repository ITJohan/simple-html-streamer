import { assert, assertEquals } from "jsr:@std/assert";
import { escapeHTML, html, stream, suspend } from "./html-streamer.js";

/**
 * @param {ReadableStream} stream
 * @returns {Promise<string>}
 */
const consumeStream = async (
  /** @type {ReadableStream} */ stream,
) => {
  const decoder = new TextDecoder();
  let result = "";
  for await (const chunk of stream) {
    result += decoder.decode(chunk);
  }
  return result;
};

/**
 * @param {ReturnType<html>} generator
 * @returns {string}
 */
const consumeGenerator = (generator) => {
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }
  return result;
};

Deno.test(`${html.name} renders empty string`, () => {
  // Arrange
  const expected = `

  `;

  // Act
  const actual = consumeGenerator(html`

  `);

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${html.name} renders a static string`, () => {
  // Arrange
  const expected = `
    <h1>hello</h1>
  `;

  // Act
  const actual = consumeGenerator(html`
    <h1>hello</h1>
  `);

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${html.name} renders dynamic primitives`, () => {
  // Arrange
  const expected = `
    <ul>
      <li>${`hello`}</li>
      <li>${123}</li>
      <li>${true}</li>
    </ul>
  `;

  // Act
  const actual = consumeGenerator(html`
    <ul>
      <li>${`hello`}</li>
      <li>${123}</li>
      <li>${true}</li>
    </ul>
  `);

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${html.name} renders a nested ${html.name}`, () => {
  // Arrange
  const nestedHtml = html`
    hello
  `;
  const expected = `
    <p>
    hello
  </p>
  `;

  // Act
  const actual = consumeGenerator(html`
    <p>${nestedHtml}</p>
  `);

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${html.name} renders a deeply nested ${html.name}`, () => {
  // Arrange
  const deeplyNestedHtml = html`
    hello
  `;
  const nestedHtml = html`
    <li>${deeplyNestedHtml}</li>
  `;
  const expected = `
    <ul>
      
    <li>
    hello
  </li>
  
    </ul>
  `;

  // Act
  const actual = consumeGenerator(html`
    <ul>
      ${nestedHtml}
    </ul>
  `);

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${html.name} renders an array of ${html.name} values`, () => {
  // Arrange
  const items = ["a", 1, true].map((value) =>
    html`
      <li>${value}</li>
    `
  );
  const expected = `
    <ul>
      
      <li>a</li>
    
      <li>1</li>
    
      <li>true</li>
    
    </ul>
  `;

  // Act
  const actual = consumeGenerator(html`
    <ul>
      ${items}
    </ul>
  `);

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${html.name} renders ${suspend.name} placeholder`, () => {
  // Arrange
  const placeholder = html`
    <p>Loading⏳</p>
  `;
  const promise = new Promise((resolve) =>
    resolve(html`
      <p>Loaded✅</p>
    `)
  );
  const suspendPromise = suspend(placeholder, promise);

  // Act
  const actual = consumeGenerator(html`
    <div>
      ${suspendPromise}
    </div>
  `);
  const match = actual.match(/id="placeholder-(.+?)"/);

  // Assert
  assert(match);
  const expected = `
    <div>
      <div id="placeholder-${match[1]}">
    <p>Loading⏳</p>
  </div>
    </div>
  `;
  assertEquals(actual, expected);
});

Deno.test(`${stream.name} streams the given ${html.name} generator`, async () => {
  // Arrange
  const generator = html`
    <p>hello world</p>
  `;
  const expected = `
    <p>hello world</p>
  `;

  // Act
  const actual = await consumeStream(stream(generator));

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${stream.name} support nested ${suspend.name}`, async () => {
  // Arrange
  const nestedPlaceholder = html`
    <p>Loading nested⏳</p>
  `;
  const nestedContent = html`
    <p>Loaded nested✅</p>
  `;
  const nestedSuspend = suspend(
    nestedPlaceholder,
    new Promise((resolve) => resolve(nestedContent)),
  );
  const placeholder = html`
    <p>Loading⏳</p>
  `;
  const content = html`
    <p>Loaded✅</p>
  `;
  const promise = new Promise((resolve) =>
    resolve(html`
      ${content}${nestedSuspend}
    `)
  );

  // Act
  const actual = await consumeStream(
    stream(html`
      <div>
        ${suspend(placeholder, promise)}
      </div>
    `),
  );
  const matches = [...actual.matchAll(/id="placeholder-(.+?)"/g)];

  // Assert
  assert(matches.length === 2);
  assert(matches[0][1]);
  assert(matches[1][1]);
  const expected = `
      <div>
        <div id="placeholder-${matches[0][1]}">
    <p>Loading⏳</p>
  </div>
      </div>
    
    <template id="content-${matches[0][1]}">
      
      
    <p>Loaded✅</p>
  <div id="placeholder-${matches[1][1]}">
    <p>Loading nested⏳</p>
  </div>
    
    </template>
    <script>
    (function() {
      const content = document.getElementById('content-${matches[0][1]}');
      const placeholder = document.getElementById('placeholder-${
    matches[0][1]
  }');
      if (content && placeholder) {
        placeholder.replaceWith(content.content.cloneNode(true));
        content.remove();
        document.currentScript.remove();
      }
    })()
    </script>
  
    <template id="content-${matches[1][1]}">
      
    <p>Loaded nested✅</p>
  
    </template>
    <script>
    (function() {
      const content = document.getElementById('content-${matches[1][1]}');
      const placeholder = document.getElementById('placeholder-${
    matches[1][1]
  }');
      if (content && placeholder) {
        placeholder.replaceWith(content.content.cloneNode(true));
        content.remove();
        document.currentScript.remove();
      }
    })()
    </script>
  `;
  assertEquals(actual, expected);
});

Deno.test(`${suspend.name} returned object shows placeholder when used as a string`, () => {
  // Arrange
  const placeholder = html`
    <p>Loading⏳</p>
  `;
  const promise = new Promise(() => {});

  // Act
  const actual = `${suspend(placeholder, promise)}`;
  const match = actual.match(/id="placeholder-(.+?)"/);

  // Assert
  assert(match);
  const expected = `<div id="placeholder-${match[1]}">
    <p>Loading⏳</p>
  </div>`;
  assertEquals(actual, expected);
});

Deno.test(`${suspend.name} promise resolves to generator content with injected script`, async () => {
  // Arrange
  const placeholder = html`
    <p>Loading⏳</p>
  `;
  /** @type {Promise<ReturnType<html>>} */
  const promise = new Promise((resolve) =>
    resolve(html`
      <p>Loaded✅</p>
    `)
  );

  // Act
  const actual = consumeGenerator(await suspend(placeholder, promise));
  const match = actual.match(/id="content-(.+?)"/);

  // Assert
  assert(match);
  const expected = `
    <template id="content-${match[1]}">
      
      <p>Loaded✅</p>
    
    </template>
    <script>
    (function() {
      const content = document.getElementById('content-${match[1]}');
      const placeholder = document.getElementById('placeholder-${match[1]}');
      if (content && placeholder) {
        placeholder.replaceWith(content.content.cloneNode(true));
        content.remove();
        document.currentScript.remove();
      }
    })()
    </script>
  `;
  assertEquals(actual, expected);
});

Deno.test(`${suspend.name} promise rejects to error`, async () => {
  // Arrange
  const placeholder = html`
    <p>Loading⏳</p>
  `;
  /** @type {Promise<ReturnType<html>>} */
  const promise = new Promise((_resolve, reject) =>
    reject(html`
      <p>Failed❌</p>
    `)
  );

  // Act
  const actual = consumeGenerator(await suspend(placeholder, promise));
  const match = actual.match(/id="content-(.+?)"/);

  // Assert
  assert(match);
  const expected = `
    <template id="content-${match[1]}">
      
      <p>Failed❌</p>
    
    </template>
    <script>
    (function() {
      const content = document.getElementById('content-${match[1]}');
      const placeholder = document.getElementById('placeholder-${match[1]}');
      if (content && placeholder) {
        placeholder.replaceWith(content.content.cloneNode(true));
        content.remove();
        document.currentScript.remove();
      }
    })()
    </script>
  `;
  assertEquals(actual, expected);
});

Deno.test(`${escapeHTML.name} escapes a HTML string`, () => {
  // Arrange
  const maliciousHtml = "<script>alert('XSS attack!!!');</script>";
  const expected =
    "&lt;script&gt;alert(&#039;XSS attack!!!&#039;);&lt;/script&gt;";

  // Act
  const actual = escapeHTML(maliciousHtml);

  // Assert
  assertEquals(actual, expected);
});
