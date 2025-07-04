import { assertEquals } from "jsr:@std/assert";
import { html } from "./html-streamer.js";

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

// TODO: number[]

// TODO: boolean[]

// TODO: Generator[]

// TODO: Promise<string>

// TODO: Promise<number>

// TODO: Promise<boolean>

// TODO: Promise<string[]>

// TODO: Promise<number[]>

// TODO: Promise<string[]>

// TODO: Promise<Generator[]> (AsyncGenerator?)
