import { assertEquals } from "jsr:@std/assert";
import { html } from "./html-streamer.js";

Deno.test(`${html.name} renders empty string`, () => {
  // Arrange
  const expected = `

  `;

  // Act
  const generator = html`

  `;
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
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
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
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
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
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
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
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
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
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
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
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
  const result = generator.next();

  // Assert
  assertEquals(result.value, expected);
});

// TODO: number[]

// TODO: boolean[]

// TODO: Promise<string>

// TODO: Promise<number>

// TODO: Promise<boolean>

// TODO: Promise<string[]>

// TODO: Promise<number[]>

// TODO: Promise<string[]>
