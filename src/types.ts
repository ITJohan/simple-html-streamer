export type HTMLGenerator = Generator<
  (
    | string
    | number
    | boolean
    | Promise<string | number | boolean | HTMLGenerator>
  ),
  void,
  unknown
>;

export type SupportedValue =
  | (string | number | boolean | HTMLGenerator)
  | (string | number | boolean | HTMLGenerator)[]
  | Promise<(string | number | boolean | HTMLGenerator)>
  | Promise<(string | number | boolean | HTMLGenerator)>[];
