type HTMLStreamValues =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | boolean[]
  | AsyncGenerator<string, void, unknown>
  | AsyncGenerator<string, void, unknown>[]
  | Promise<AsyncGenerator<string, void, unknown>>
  | Promise<AsyncGenerator<string, void, unknown>>[];
