import { assertEquals } from "jsr:@std/assert";
import { html } from "./html-streamer.js";

Deno.test(`${html.name} renders empty string`, async () => {
  // Arrange
  const expected = `

  `;

  // Act
  const generator = html`

  `;
  const result = await generator.next();

  // Assert
  assertEquals(result.value, expected);
});

Deno.test(`${html.name} renders a static string`, async () => {
  // Arrange
  const expected = `
    <h1>hello</h1>
  `;

  // Act
  const generator = html`
    <h1>hello</h1>
  `;
  const result = await generator.next();

  // Assert
  assertEquals(result.value, expected);
});

Deno.test(`${html.name} renders a dynamic string`, async () => {
  // Arrange
  const expected = `
    <p>${`hello`}</p>
  `;

  // Act
  const generator = html`
    <p>${`hello`}</p>
  `;
  const result = await generator.next();

  // Assert
  assertEquals(result.value, expected);
});

Deno.test(`${html.name} renders a dynamic number`, async () => {
  // Arrange
  const expected = `
    <p>${123}</p>
  `;

  // Act
  const generator = html`
    <p>${123}</p>
  `;
  const result = await generator.next();

  // Assert
  assertEquals(result.value, expected);
});

Deno.test(`${html.name} renders a dynamic boolean`, async () => {
  // Arrange
  const expected = `
    <p>${true}</p>
  `;

  // Act
  const generator = html`
    <p>${true}</p>
  `;
  const result = await generator.next();

  // Assert
  assertEquals(result.value, expected);
});

Deno.test(`${html.name} renders a nested ${html.name}`, async () => {
  // Arrange
  const nestedHtml = html`
    hello
  `;
  const expected = `
    <p>hello</p>
  `;

  // Act
  const generator = html`
    <p>${nestedHtml}</p>
  `;
  const result = await generator.next();

  // Assert
  assertEquals(result.value, expected);
});

// TODO: AsyncGenerator[]

// TODO: number[]

// TODO: boolean[]

// TODO: Promise<string>

// TODO: Promise<number>

// TODO: Promise<boolean>

// TODO: Promise<string[]>

// TODO: Promise<number[]>

// TODO: Promise<string[]>
