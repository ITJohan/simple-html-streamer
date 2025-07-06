import { assertEquals } from "jsr:@std/assert";
import { html, isGenerator, stream, suspend } from "./html-streamer.js";

export const consumeStream = async (
  /** @type {ReadableStream} */ stream,
) => {
  let result = "";
  for await (const chunk of stream) {
    result += chunk;
  }
  return result;
};

Deno.test(`${html.name} renders empty string`, () => {
  // Arrange
  const expected = `

  `;

  // Act
  const generator = html`

  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a static string`, () => {
  // Arrange
  const expected = `
    <h1>hello</h1>
  `;

  // Act
  const generator = html`
    <h1>hello</h1>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a dynamic string`, () => {
  // Arrange
  const expected = `
    <p>${`hello`}</p>
  `;

  // Act
  const generator = html`
    <p>${`hello`}</p>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a dynamic number`, () => {
  // Arrange
  const expected = `
    <p>${123}</p>
  `;

  // Act
  const generator = html`
    <p>${123}</p>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a dynamic boolean`, () => {
  // Arrange
  const expected = `
    <p>${true}</p>
  `;

  // Act
  const generator = html`
    <p>${true}</p>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
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
  const generator = html`
    <p>${nestedHtml}</p>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
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
  const generator = html`
    <ul>
      ${nestedHtml}
    </ul>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a string generator array`, () => {
  // Arrange
  const items = ["a", "b", "c"].map((value) =>
    html`
      <li>${value}</li>
    `
  );
  const expected = `
    <ul>
      
      <li>a</li>
    
      <li>b</li>
    
      <li>c</li>
    
    </ul>
  `;

  // Act
  const generator = html`
    <ul>
      ${items}
    </ul>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a number generator array`, () => {
  // Arrange
  const items = [1, 2, 3].map((value) =>
    html`
      <li>${value}</li>
    `
  );
  const expected = `
    <ul>
      
      <li>1</li>
    
      <li>2</li>
    
      <li>3</li>
    
    </ul>
  `;

  // Act
  const generator = html`
    <ul>
      ${items}
    </ul>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders a boolean generator array`, () => {
  // Arrange
  const items = [true, false, true].map((value) =>
    html`
      <li>${value}</li>
    `
  );
  const expected = `
    <ul>
      
      <li>true</li>
    
      <li>false</li>
    
      <li>true</li>
    
    </ul>
  `;

  // Act
  const generator = html`
    <ul>
      ${items}
    </ul>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${html.name} renders suspend placeholder`, () => {
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
  const expected = `
    <div>
      
    <p>Loading⏳</p>
  
    </div>
  `;

  // Act
  const generator = html`
    <div>
      ${suspendPromise}
    </div>
  `;
  let result = "";
  for (const chunk of generator) {
    result += chunk;
  }

  // Assert
  assertEquals(result, expected);
});

Deno.test(`${suspend.name} returned type shows placeholder when used as a string`, () => {
  // Arrange
  const placeholder = html`
    <p>Loading⏳</p>
  `;
  const promise = new Promise(() => {});
  const expected = `
    <p>Loading⏳</p>
  `;

  // Act
  const actual = `${suspend(placeholder, promise)}`;

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${suspend.name} promise resolves to generator content`, async () => {
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
  const expected = `
      <p>Loaded✅</p>
    `;

  // Act
  const actual = await consumeStream(
    stream(await suspend(placeholder, promise)),
  );

  // Assert
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
  const expected = `
      <p>Failed❌</p>
    `;

  // Act
  let actual = "";
  try {
    await suspend(placeholder, promise);
  } catch (error) {
    if (isGenerator(error)) {
      actual = await consumeStream(stream(error));
    }
  }

  // Assert
  assertEquals(actual, expected);
});

Deno.test(`${stream.name} streams the given html generator`, async () => {
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
