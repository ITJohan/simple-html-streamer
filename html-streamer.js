export async function* html(
  /** @type {TemplateStringsArray}  */ strings,
  /** @type {any[]} */ ...values
) {
  const nestedHtml =
    /** @type {AsyncGenerator<any, void, unknown>[]} */ (values.filter(
      (value) => value[Symbol.asyncIterator].type === "function",
    ));
  yield String.raw({ raw: strings }, ...values);
}
